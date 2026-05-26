const ShareService = {
  async shareLink(title, url, description = '') {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url
        });
        return { success: true };
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
        }
        return { success: false, cancelled: err.name === 'AbortError' };
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      return { success: true, copied: true };
    } catch (err) {
      return { success: false, error: '无法复制链接' };
    }
  },

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return { success: true };
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return { success: true };
      } catch (e) {
        document.body.removeChild(textArea);
        return { success: false };
      }
    }
  },

  getComicShareUrl(comicId) {
    return `${window.location.origin}${window.location.pathname}#/detail/${comicId}`;
  },

  getChapterShareUrl(comicId, chapterNo) {
    return `${window.location.origin}${window.location.pathname}#/reader/${comicId}/${chapterNo}`;
  },

  generateShareImage(comic) {
    return {
      title: comic.title,
      description: comic.description || `《${comic.title}》 - ${comic.author}`,
      cover: comic.cover
    };
  }
};