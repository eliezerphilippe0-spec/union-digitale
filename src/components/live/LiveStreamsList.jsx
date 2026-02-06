/**
 * Live Streams List - Shows active live shopping streams
 */

import React from 'react';
import { Play, Users, Clock, ChevronRight, Radio } from 'lucide-react';

const mockStreams = [
  {
    id: 1,
    title: 'Tech Unboxing: iPhone 15 Pro',
    host: 'TechHaiti',
    hostAvatar: '👨‍💻',
    viewers: 234,
    thumbnail: '📱',
    category: 'Électronique',
    isLive: true,
    discount: '-20%',
  },
  {
    id: 2,
    title: 'Mode Été: Collection Exclusive',
    host: 'StyleCaribbean',
    hostAvatar: '👩‍🎤',
    viewers: 189,
    thumbnail: '👗',
    category: 'Mode',
    isLive: true,
    discount: '-30%',
  },
  {
    id: 3,
    title: 'Skincare Routine Live',
    host: 'BeautyHT',
    hostAvatar: '💄',
    viewers: 156,
    thumbnail: '🧴',
    category: 'Beauté',
    isLive: true,
  },
  {
    id: 4,
    title: 'Cuisine Créole en Direct',
    host: 'ChefLocal',
    hostAvatar: '👨‍🍳',
    viewers: 98,
    thumbnail: '🍲',
    category: 'Cuisine',
    isLive: false,
    startsIn: '2h',
  },
];

const LiveStreamCard = ({ stream }) => {
  const handleClick = () => {
    window.location.href = `/live/${stream.id}`;
  };

  return (
    <div 
      onClick={handleClick}
      className="flex-shrink-0 w-64 bg-white dark:bg-neutral-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-neutral-700 cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
    >
      {/* Thumbnail */}
      <div className="relative h-36 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
        <span className="text-6xl">{stream.thumbnail}</span>
        
        {/* Live Badge */}
        {stream.isLive ? (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            <Radio className="w-3 h-3 animate-pulse" />
            LIVE
          </div>
        ) : (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-gray-800/80 text-white text-xs font-bold px-2 py-1 rounded-full">
            <Clock className="w-3 h-3" />
            Dans {stream.startsIn}
          </div>
        )}

        {/* Discount Badge */}
        {stream.discount && (
          <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {stream.discount}
          </div>
        )}

        {/* Viewers */}
        {stream.isLive && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
            <Users className="w-3 h-3" />
            {stream.viewers}
          </div>
        )}

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30">
          <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center">
            <Play className="w-6 h-6 text-primary-600 ml-1" fill="currentColor" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <span className="text-xs text-primary-600 font-medium">{stream.category}</span>
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1 mt-0.5">
          {stream.title}
        </h3>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-lg">{stream.hostAvatar}</span>
          <span className="text-xs text-gray-500">{stream.host}</span>
        </div>
      </div>
    </div>
  );
};

const LiveStreamsList = () => {
  const liveStreams = mockStreams.filter(s => s.isLive);
  const upcomingStreams = mockStreams.filter(s => !s.isLive);

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-4 px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center relative">
            <Play className="w-5 h-5 text-white" fill="white" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">Shopping en Direct</h2>
            <p className="text-sm text-gray-500">{liveStreams.length} streams en cours</p>
          </div>
        </div>
        <button 
          onClick={() => window.location.href = '/live'}
          className="flex items-center gap-1 text-primary-600 text-sm font-medium hover:text-primary-700"
        >
          Voir tout <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto px-4 pb-4 scrollbar-hide">
        {[...liveStreams, ...upcomingStreams].map(stream => (
          <LiveStreamCard key={stream.id} stream={stream} />
        ))}
      </div>
    </section>
  );
};

export default LiveStreamsList;
