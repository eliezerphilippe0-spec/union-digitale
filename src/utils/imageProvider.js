const provider = import.meta.env.VITE_IMAGE_RESIZE_PROVIDER || 'none';

export const buildResponsiveImage = (url, widths = [480, 768, 1200]) => {
  if (!url) return { src: '', srcSet: undefined };

  if (provider === 'none') {
    return { src: url, srcSet: undefined };
  }

  if (provider === 'cloudinary') {
    const parts = url.split('/upload/');
    if (parts.length < 2) return { src: url, srcSet: undefined };
    const [base, path] = parts;
    const srcSet = widths.map((w) => `${base}/upload/w_${w}/${path} ${w}w`).join(', ');
    return { src: `${base}/upload/w_${widths[1]}/${path}`, srcSet };
  }

  if (provider === 'imgix') {
    const srcSet = widths.map((w) => `${url}?w=${w}&auto=format ${w}w`).join(', ');
    return { src: `${url}?w=${widths[1]}&auto=format`, srcSet };
  }

  if (provider === 'firebase') {
    const srcSet = widths.map((w) => `${url}&width=${w} ${w}w`).join(', ');
    return { src: `${url}&width=${widths[1]}`, srcSet };
  }

  return { src: url, srcSet: undefined };
};
