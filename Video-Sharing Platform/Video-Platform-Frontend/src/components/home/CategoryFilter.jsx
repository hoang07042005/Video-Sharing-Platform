import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Music,
  Monitor,
  Gamepad2,
  Tv,
  BookOpen,
  Dumbbell,
  LayoutGrid,
  Flame,
  ChevronRight,
  Clapperboard,
  Coffee,
} from "lucide-react";

import * as LucideIcons from "lucide-react";
import { getIconColor } from "../../utils/iconHelpers";

export const DEFAULT_CATEGORY_ICON = {
  icon: "LayoutGrid",
  iconColor: "text-gray-400",
  bg: "bg-white/10",
};

export default function CategoryFilter({ onSelect }) {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("/api/videos/categories");
        setCategories([
          { id: 0, name: "Tất cả", icon: "Flame" },
          ...response.data,
        ]);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
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
    scrollRef.current?.scrollBy({ left: 240, behavior: "smooth" });
  };

  return (
    <div>
      {/* Header */}
      {/* <h3 className="text-white font-bold text-sm mb-3">Khám phá theo danh mục</h3> */}

      {/* Scrollable row + arrow */}
      <div className="relative flex items-center pt-5">
        <div
          ref={scrollRef}
          className="flex items-center gap-2 overflow-x-auto scrollbar-hide pr-10"
        >
          {categories.map((category) => {
            const isActive = activeCategory === category.id;
            const IconComponent =
              LucideIcons[category.icon] || LucideIcons.LayoutGrid;

            const iconColor = getIconColor(category.icon);

            return (
              <button
                key={category.id}
                onClick={() => handleSelect(category.id)}
                className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-pink-600 to-purple-600 text-white border border-transparent"
                    : "bg-[#18181C] text-gray-400 border border-white/5 hover:bg-white/5 hover:text-white"
                }`}
              >
                {/* Icon box */}
                <span className={`w-6 h-6 flex items-center justify-center`}>
                  <IconComponent className={`w-5 h-5 ${iconColor}`} />
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
