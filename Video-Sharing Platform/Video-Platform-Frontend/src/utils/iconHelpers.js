export const getIconColor = (iconName, isActive = false) => {
  if (isActive) return 'text-white';
  switch (iconName) {
    case 'Music': return 'text-pink-400';
    case 'Monitor': return 'text-blue-400';
    case 'Tv': return 'text-yellow-400';
    case 'Gamepad2': return 'text-green-400';
    case 'BookOpen': return 'text-purple-400';
    case 'Dumbbell': return 'text-orange-400';
    case 'Clapperboard': return 'text-yellow-400';
    case 'Flame': return 'text-[#FF5722]';
    case 'Coffee': return 'text-amber-500';
    case 'Plane': return 'text-cyan-400';
    case 'Heart': return 'text-red-400';
    case 'Sparkles': return 'text-yellow-300';
    case 'Trophy': return 'text-amber-400';
    case 'Code': return 'text-blue-500';
    case 'Camera': return 'text-indigo-400';
    case 'Utensils': return 'text-orange-500';
    case 'Mic': return 'text-purple-500';
    case 'Headphones': return 'text-teal-400';
    case 'Briefcase': return 'text-amber-600';
    case 'Globe': return 'text-blue-400';
    case 'ShoppingBag': return 'text-pink-500';
    case 'LayoutGrid': return 'text-gray-400';
    default: return 'text-gray-400';
  }
};
