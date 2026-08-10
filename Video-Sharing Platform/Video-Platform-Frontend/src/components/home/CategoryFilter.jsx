import { useState, useEffect } from 'react';
import axios from 'axios';

export default function CategoryFilter() {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(0);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('/api/videos/categories');
        setCategories([{ id: 0, name: 'Tất cả' }, ...response.data]);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  if (categories.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide mb-2">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => setActiveCategory(category.id)}
          className={`whitespace-nowrap px-4 py-1 rounded-full text-sm font-medium transition-colors border ${
            activeCategory === category.id
              ? 'bg-[#FF8A65] text-black border-transparent'
              : 'bg-transparent text-gray-300 border-white/10 hover:border-white/40'
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
