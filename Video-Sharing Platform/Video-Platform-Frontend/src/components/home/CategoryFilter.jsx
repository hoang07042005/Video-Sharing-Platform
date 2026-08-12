import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Music, Monitor, Gamepad2, Tv, BookOpen, Dumbbell, LayoutGrid, Flame, ChevronRight, Clapperboard, Coffee } from 'lucide-react';

// Map danh mục → icon + màu nền icon box
export const CATEGORY_ICONS = {
  'Tất cả':    { icon: Flame,      iconColor: 'text-white'     },
  'Âm nhạc':   { icon: Music,      iconColor: 'text-pink-300'     },
  'Công nghệ': { icon: Monitor,    iconColor: 'text-blue-300'     },
  'Giải trí':  { icon: Tv,         iconColor: 'text-yellow-300'     },
  'Trò chơi':  { icon: Gamepad2,   iconColor: 'text-green-300'     },
  'Giáo dục':  { icon: BookOpen,   iconColor: 'text-purple-300'     },
  'Thể thao':  { icon: Dumbbell,   iconColor: 'text-orange-300'     },
  'Game':      { icon: Gamepad2,   iconColor: 'text-green-300'     },
  'Phim & TV': { icon: Clapperboard, iconColor: 'text-yellow-300'     },
  'Đời sống':  { icon: Coffee,     iconColor: 'text-orange-300'     },
};

export const DEFAULT_CATEGORY_ICON = { icon: LayoutGrid, iconColor: 'text-gray-400', bg: 'bg-white/10' };

export default function CategoryFilter({ onSelect }) {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('/api/videos/categories');
        setCategories([{ id: 0, name: 'Tất cả' }, ...response.data]);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  if (categories.length === 0) return null;

  const handleSelect = (id) => {
    setActiveCategory(id);
    onSelect?.(id);
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 240, behavior: 'smooth' });
  };

  return (
    <div>
      {/* Header */}
      <h3 className="text-white font-bold text-sm mb-3">Khám phá theo danh mục</h3>

      {/* Scrollable row + arrow */}
      <div className="relative flex items-center">
        <div
          ref={scrollRef}
          className="flex items-center gap-2 overflow-x-auto scrollbar-hide pr-10"
        >
          {categories.map((category) => {
            const isActive = activeCategory === category.id;
            const { icon: Icon, iconColor, bg } = CATEGORY_ICONS[category.name] ?? DEFAULT_CATEGORY_ICON;

            return (
              <button
                key={category.id}
                onClick={() => handleSelect(category.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl whitespace-nowrap text-sm font-medium transition-all cursor-pointer shrink-0 border ${
                  isActive
                    ? 'bg-[#FF5722]/15 border-[#FF5722]/40 text-white'
                    : 'bg-transparent border-white/10 text-gray-300 hover:border-white/30 hover:text-white'
                }`}
              >
                {/* Icon box */}
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${isActive ? '' : bg}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : iconColor}`} />
                </span>
                {category.name}
              </button>
            );
          })}
        </div>

        {/* Scroll arrow */}
        <button
          onClick={scrollRight}
          className="absolute right-0 w-8 h-8 bg-[#1A1A1A] hover:bg-[#272727] border border-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer shrink-0 shadow-lg"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
