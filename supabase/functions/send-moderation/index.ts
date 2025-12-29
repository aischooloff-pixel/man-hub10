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

// Get or create short ID for article
async function getOrCreateShortId(articleId: string): Promise<string> {
  const { data, error } = await supabase.rpc('get_or_create_short_id', { p_article_id: articleId });
  
  if (error) {
    console.error('Error getting short ID:', error);
    return articleId.substring(0, 8);
  }
  
  return data;
}

async function sendTelegramMessage(chatId: string | number, text: string, options: any = {}) {
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

async function sendTelegramPhoto(chatId: string | number, photoBase64: string, caption: string, options: any = {}) {
  const url = `https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/sendPhoto`;
  
  // Extract base64 data and mime type
  const matches = photoBase64.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    console.error('Invalid base64 format');
    return { ok: false, error: 'Invalid base64 format' };
  }
  
  const base64Data = matches[2];
  const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
  
  // Create form data
  const formData = new FormData();
  formData.append('chat_id', String(chatId));
  formData.append('photo', new Blob([binaryData], { type: 'image/jpeg' }), 'photo.jpg');
  formData.append('caption', caption);
  formData.append('parse_mode', 'HTML');
  
  if (options.reply_markup) {
    formData.append('reply_markup', JSON.stringify(options.reply_markup));
  }
  
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });
  
  return response.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { articleId } = await req.json();
    console.log('Sending moderation request for article:', articleId);

    // Get article with author info
    const { data: article, error } = await supabase
      .from('articles')
      .select('*, author:author_id(first_name, username, telegram_id)')
      .eq('id', articleId)
      .maybeSingle();

    if (error || !article) {
      console.error('Error fetching article:', error);
      return new Response(
        JSON.stringify({ error: 'Article not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate short ID for moderation buttons
    const shortId = await getOrCreateShortId(article.id);

    const authorData = article.author as any;

    // Determine media info
    const isBase64Image = article.media_url?.startsWith('data:');
    const isYouTube = article.media_type === 'youtube';
    const youtubeUrl = isYouTube ? `https://youtube.com/watch?v=${article.media_url}` : null;

    let mediaDisplay = '';
    if (article.media_url) {
      if (isBase64Image) {
        mediaDisplay = '🖼 <b>Медиа:</b> Изображение (см. выше)';
      } else if (isYouTube) {
        mediaDisplay = `🎬 <b>Медиа:</b> <a href="${youtubeUrl}">YouTube видео</a>`;
      } else {
        mediaDisplay = `🖼 <b>Медиа:</b> ${article.media_url.substring(0, 50)}...`;
      }
    }

    const message = `🆕 <b>Новая статья на модерации</b>

📝 <b>Заголовок:</b> ${article.title}

👤 <b>Автор:</b> ${article.is_anonymous ? 'Аноним' : authorData?.first_name || 'Unknown'} ${authorData?.username ? `(@${authorData.username})` : ''}

📄 <b>Превью:</b>
${article.preview || article.body?.substring(0, 300) || 'Нет превью'}...

${mediaDisplay}`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '✅ Принять', callback_data: `approve:${shortId}` },
          { text: '❌ Отклонить', callback_data: `reject:${shortId}` },
        ],
      ],
    };

    let result;
    
    // If base64 image, send as photo first
    if (isBase64Image) {
      result = await sendTelegramPhoto(TELEGRAM_ADMIN_CHAT_ID, article.media_url, message, {
        reply_markup: keyboard,
      });
    } else {
      result = await sendTelegramMessage(TELEGRAM_ADMIN_CHAT_ID, message, {
        reply_markup: keyboard,
      });
    }

    console.log('Telegram API response:', result);

    // Store message ID for later reference
    if (result.ok && result.result?.message_id) {
      await supabase
        .from('articles')
        .update({ telegram_message_id: result.result.message_id })
        .eq('id', articleId);
    }

    return new Response(
      JSON.stringify({ success: true, messageId: result.result?.message_id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending moderation request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
