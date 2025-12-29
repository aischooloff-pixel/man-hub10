import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ADMIN_BOT_TOKEN = Deno.env.get('ADMIN_BOT_TOKEN')!;
const TELEGRAM_ADMIN_CHAT_ID = Deno.env.get('TELEGRAM_ADMIN_CHAT_ID')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function sendAdminMessage(chatId: string | number, text: string, options: any = {}) {
  const url = `https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/sendMessage`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      ...options,
    }),
  });
  
  return response.json();
}

async function getOrCreateShortId(articleId: string): Promise<string> {
  const { data, error } = await supabase.rpc('get_or_create_short_id', { p_article_id: articleId });
  if (error) throw error;
  return data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { articleId } = await req.json();
    
    if (!articleId) {
      return new Response(JSON.stringify({ error: 'articleId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get article with author info and pending edit
    const { data: article, error: aErr } = await supabase
      .from('articles')
      .select(`
        *,
        author:author_id(telegram_id, username, first_name, last_name)
      `)
      .eq('id', articleId)
      .maybeSingle();

    if (aErr || !article) {
      return new Response(JSON.stringify({ error: 'Article not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!article.pending_edit) {
      return new Response(JSON.stringify({ error: 'No pending edit for this article' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const shortId = await getOrCreateShortId(articleId);
    const pendingEdit = article.pending_edit as any;

    // Build message showing changes
    let message = `✏️ <b>Редактирование статьи</b>\n\n`;
    message += `🆔 Код: <code>${shortId}</code>\n`;
    message += `👤 Автор: ${article.author?.username ? '@' + article.author.username : article.author?.first_name || 'Аноним'}\n\n`;
    
    message += `<b>📝 Изменения:</b>\n\n`;
    
    if (pendingEdit.title !== article.title) {
      message += `<b>Заголовок:</b>\n`;
      message += `<s>${article.title}</s>\n`;
      message += `➡️ ${pendingEdit.title}\n\n`;
    }
    
    if (pendingEdit.body !== article.body) {
      const oldPreview = article.body?.substring(0, 100) || '';
      const newPreview = pendingEdit.body?.substring(0, 100) || '';
      message += `<b>Текст (превью):</b>\n`;
      message += `<s>${oldPreview}...</s>\n`;
      message += `➡️ ${newPreview}...\n\n`;
    }

    if (pendingEdit.is_anonymous !== article.is_anonymous) {
      message += `<b>Анонимность:</b> ${article.is_anonymous ? 'Да' : 'Нет'} ➡️ ${pendingEdit.is_anonymous ? 'Да' : 'Нет'}\n\n`;
    }

    // Inline keyboard for approve/reject
    const keyboard = {
      inline_keyboard: [
        [
          { text: '✅ Одобрить', callback_data: `edit_approve:${shortId}` },
          { text: '❌ Отклонить', callback_data: `edit_reject:${shortId}` },
        ],
      ],
    };

    const result = await sendAdminMessage(TELEGRAM_ADMIN_CHAT_ID, message, { reply_markup: keyboard });

    console.log(`[send-edit-moderation] Sent edit moderation request for article ${articleId}`);

    return new Response(JSON.stringify({ success: true, message_id: result.result?.message_id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('send-edit-moderation error:', e);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
