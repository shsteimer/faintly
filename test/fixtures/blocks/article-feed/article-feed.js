import { renderBlock } from '../../../../src/faintly.js';

async function fetchArticles() {
  const response = await fetch(`${window.hlx.codeBasePath}/blocks/article-feed/articles.json`);
  const json = await response.json();

  return json.data;
}

// non-faintly decorator
// used for perf comparison
export async function decorateOld(block) {
  const articles = await fetchArticles();

  const ul = document.createElement('ul');
  articles.forEach((article) => {
    const li = document.createElement('li');
    li.className = 'article-card';
    if (article.featured) {
      li.classList.add('featured');
    }

    const imgDiv = document.createElement('div');
    imgDiv.className = 'card-img';

    const img = document.createElement('img');
    img.src = article.image;
    imgDiv.append(img);

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';

    const link = document.createElement('a');
    link.href = article.link;
    link.title = article.title;

    const h2 = document.createElement('h2');
    h2.textContent = article.title;
    link.append(h2);

    const p = document.createElement('p');
    p.textContent = article.description;
    link.append(p);

    cardBody.append(link);

    li.append(imgDiv, cardBody);

    ul.append(li);
  });

  block.replaceChildren(ul);
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
