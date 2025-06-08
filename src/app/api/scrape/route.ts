import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  const IG_USERNAME = process.env.IG_USERNAME!;
  const IG_PASSWORD = process.env.IG_PASSWORD!;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 900 });

    // Login
    await page.goto('https://www.instagram.com/accounts/login/', {
      waitUntil: 'networkidle2',
    });

    await page.waitForSelector('input[name="username"]', { timeout: 10000 });
    await page.type('input[name="username"]', IG_USERNAME, { delay: 50 });
    await page.type('input[name="password"]', IG_PASSWORD, { delay: 50 });
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });

    // Ir al perfil
    await page.goto(`https://www.instagram.com/${username}/`, {
      waitUntil: 'networkidle2',
    });

    // Esperar a que aparezca el contenido
    await page.waitForSelector('article a', { timeout: 15000 });

    // Hacer scroll para cargar más contenido (opcional)
    await page.evaluate(() => {
      window.scrollBy(0, window.innerHeight * 2);
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Extraer enlaces a los primeros 9 posts
    const postLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('article a'))
        .slice(0, 9)
        .map((el) => (el as HTMLAnchorElement).href);
    });

    const posts = [];

    for (const link of postLinks) {
      await page.goto(link, { waitUntil: 'networkidle2' });

      await page.waitForSelector('article', { timeout: 10000 });

      const post = await page.evaluate(() => {
        const img = document.querySelector('article img');
        const caption = img?.getAttribute('alt') ?? '';
        const image = img?.getAttribute('src') ?? '';
        const likesElement = document.querySelector('section span');
        const likes = likesElement?.textContent ?? '0';

        return { caption, image, likes, url: window.location.href };
      });

      posts.push(post);
    }

    await browser.close();

    // Ordenar por likes descendente (conversión simple a número)
    posts.sort((a, b) => parseInt(b.likes.replace(/[^\d]/g, '')) - parseInt(a.likes.replace(/[^\d]/g, '')));

    return NextResponse.json(posts);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to scrape Instagram' }, { status: 500 });
  }
}
