'use client';

import { useState } from 'react';

type Post = {
  image: string;
  caption: string;
  url: string;
  likes: number;
};

export default function HomePage() {
  const [username, setUsername] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchPosts = async () => {
    if (!username) return;
    setLoading(true);
    setError('');
    setPosts([]);

    try {
      const res = await fetch(`/api/scrape?username=${username}`);
      const data = await res.json();
      if (res.ok) {
        setPosts(data);
      } else {
        setError(data.error || 'Error');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    }

    setLoading(false);
  };

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Instagram Top Posts MVP
      </h1>

      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 border p-2 rounded"
          placeholder="Usuario de Instagram"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button
          onClick={fetchPosts}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="grid gap-4">
        {posts.map((post, i) => (
          <div
            key={i}
            className="border p-4 rounded shadow hover:shadow-lg transition"
          >
            <a href={post.url} target="_blank" rel="noopener noreferrer">
              <img src={post.image} alt="Post" className="w-full max-w-md" />
            </a>
            <p className="mt-2 font-semibold text-lg">❤️ {post.likes} likes</p>
            <p className="text-sm text-gray-700">{post.caption}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
