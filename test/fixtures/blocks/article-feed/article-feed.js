import { renderBlock } from '../../../../src/index.js';

async function fetchArticles() {
  const response = await fetch(`${window.hlx.codeBasePath}/blocks/article-feed/articles.json`);
  const json = await response.json();

  return json.data;
}

export default async function decorate(block) {
  await renderBlock(block, {
    fetchArticles,
    isFeaturedArticle: (context) => context.article.featured,
    articleLinkAttrs: (context) => ({
      href: context.article.link,
      title: context.article.title,
    }),
  });
}
