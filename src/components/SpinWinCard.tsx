import React, { useState, useEffect, useRef } from 'react';
import { GiftIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface MysteryBoxCardProps {
  accountName: string;
  apiKey: string;
  selectedPlayer: string;
  onEventCompleted?: () => void;
}

interface MysteryBoxData {
  id: string;
  name: string;
  description: string;
  credits: number;
  isAvailable: boolean;
  prizes: Array<{
    id: string;
    name: string;
    imgUrl?: string;
    probability: number;
  }>;
  imgUrl?: string;
}

const MysteryBoxCard: React.FC<MysteryBoxCardProps> = ({ 
  accountName, 
  apiKey,
  selectedPlayer,
  onEventCompleted 
}) => {
  const [mysteryBoxData, setMysteryBoxData] = useState<MysteryBoxData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<{
    id: string;
    name: string;
    imgUrl?: string;
  } | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  // Mock prizes for the wheel (replace with actual API data when available)
  const mockPrizes = [
    { id: '1', name: '100 Points', imgUrl: '🎯', probability: 0.3 },
    { id: '2', name: '50 Credits', imgUrl: '💰', probability: 0.2 },
    { id: '3', name: 'Special Badge', imgUrl: '🏆', probability: 0.1 },
    { id: '4', name: 'Try Again', imgUrl: '🔄', probability: 0.4 },
  ];

  const fetchMysteryBoxData = async () => {
    try {
      const response = await fetch(`https://api.gamelayer.co/api/v0/mysteryboxes/1-test-wheel?account=${encodeURIComponent(accountName)}`, {
        headers: {
          'Accept': 'application/json',
          'api-key': apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch mystery box data');
      }

      const data = await response.json();
      setMysteryBoxData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch mystery box data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = async () => {
    if (!mysteryBoxData || isOpening) return;
    
    // If there's a prize showing, close it
    if (selectedPrize) {
      setSelectedPrize(null);
      return;
    }
    
    setIsOpening(true);
    
    try {
      const response = await fetch(`https://api.gamelayer.co/api/v0/mysteryboxes/1-test-wheel/claim`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          account: accountName,
          player: selectedPlayer 
        }),
      });

      const result = await response.json();
      console.log('Claim response:', result);

      if (!response.ok || result.code === 2) {
        // Use the message from the API response
        throw new Error(result.message || 'Failed to claim mystery box');
      }

      // Check if we got a valid prize in the response
      if (result.prize && result.prize.id && result.prize.name) {
        console.log('Setting prize:', result.prize);
        setSelectedPrize({
          id: result.prize.id,
          name: result.prize.name,
          imgUrl: result.prize.imgUrl
        });
        
        // Refresh mystery box data after successful claim
        await fetchMysteryBoxData();
        
        if (onEventCompleted) {
          onEventCompleted();
        }
      } else {
        console.error('Invalid prize data in response:', result);
        throw new Error('Invalid prize data received from server');
      }
    } catch (err) {
      console.error('Error claiming mystery box:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to claim mystery box');
    } finally {
      setIsOpening(false);
    }
  };

  useEffect(() => {
    fetchMysteryBoxData();
  }, [apiKey]);

  if (isLoading) {
    return (
      <div className="w-full max-w-lg mx-auto space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 px-4">Mystery Wins</h2>
        <div className="p-4 sm:p-6 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 px-4">Mystery Wins</h2>
      <div className="w-full p-4 sm:p-6 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
        {mysteryBoxData ? (
          <div className="space-y-6">
            {/* Credits in upper right */}
            <div className="flex justify-end">
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full">
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1.003-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.547.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.264-.521H10a1 1 0 100-2H8.017a7.36 7.36 0 010-1H10a1 1 0 100-2H8.472c.08-.185.167-.36.264-.521z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-blue-700">{mysteryBoxData.credits} Credits</span>
              </div>
            </div>

            <div className="flex flex-col items-center">
              {mysteryBoxData.imgUrl && (
                <img 
                  src={mysteryBoxData.imgUrl} 
                  alt="Mystery Box"
                  className="w-32 h-32 mb-4 object-contain"
                />
              )}
              <p className="text-gray-600 text-center">{mysteryBoxData.description}</p>
            </div>
            
            {/* Prize Result */}
            {selectedPrize && (
              <div className="text-center p-6 bg-purple-50 rounded-xl border border-purple-100">
                {selectedPrize.imgUrl ? (
                  <img 
                    src={selectedPrize.imgUrl} 
                    alt={selectedPrize.name}
                    className="w-32 h-32 mx-auto mb-3 object-contain"
                  />
                ) : (
                  <div className="text-4xl mb-3">🎁</div>
                )}
                <div className="text-lg font-medium text-purple-700">
                  Congratulations! You won: {selectedPrize.name}!
                </div>
              </div>
            )}

            {/* Centered Open/Close Button */}
            <div className="flex justify-center">
              <button
                onClick={handleOpen}
                disabled={isOpening}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  isOpening
                    ? 'bg-gray-100 text-gray-400 cursor-wait'
                    : selectedPrize
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
              >
                {isOpening ? 'Opening...' : selectedPrize ? 'Close' : 'Open!'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-4">No mystery box available</div>
        )}
      </div>
    </div>
  );
};

export default MysteryBoxCard; 