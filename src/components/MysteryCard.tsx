import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'
import Image from 'next/image'

interface Prize {
  id: string
  name: string
  description: string
  stock: number
  probability: number
  imgUrl?: string
  tags: string[]
}

interface MysteryBox {
  id: string
  name: string
  description: string
  imgUrl: string
  credits: number
  isAvailable: boolean
  stock: {
    redeemed: number
    available: number
    count: number
  }
  active: {
    from: string
    to: string
  }
  countLimit: number
  limitCount: boolean
  period: string
  requirement: {
    category: string
    tags: string[]
    missions: any[]
    achievements: any[]
    level: any
  }
  tags: string[]
  prizes: any[]
}

interface MysteryCardProps {
  accountName: string
  apiKey: string
  playerId: string
  mysteryBoxId: string
  onEventCompleted?: () => void
}

const MysteryCard: React.FC<MysteryCardProps> = ({
  playerId,
  accountName,
  apiKey,
  mysteryBoxId,
  onEventCompleted
}) => {
  const [isSpinning, setIsSpinning] = useState(false)
  const [credits, setCredits] = useState(0)
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null)
  const [wheelRotation, setWheelRotation] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [mysteryBox, setMysteryBox] = useState<MysteryBox | null>(null)
  const wheelRef = useRef<HTMLDivElement>(null)
  const [wonPrizes, setWonPrizes] = useState<string[]>([])
  const isMountedRef = useRef(true)

  // Debug logging
  useEffect(() => {
    console.log('Spin button state:', { 
      isSpinning, 
      isAvailable: mysteryBox?.isAvailable,
      mysteryBoxId: mysteryBox?.id,
      playerId,
      accountName
    })
  }, [isSpinning, mysteryBox, playerId, accountName])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Data fetching effect
  useEffect(() => {
    const fetchData = async () => {
      if (!isMountedRef.current) return
      await fetchMysteryBoxAndPrizes()
    }

    // Initial fetch
    fetchData()

    // Set up polling
    const interval = setInterval(() => {
      if (!isSpinning && isMountedRef.current) {
        fetchData()
      }
    }, 5000)

    return () => {
      clearInterval(interval)
    }
  }, [accountName, apiKey, isSpinning])

  const fetchMysteryBoxAndPrizes = async () => {
    if (!accountName || !apiKey || !mysteryBoxId) {
      console.error('Missing required props:', { accountName, apiKey, mysteryBoxId });
      toast.error('Missing required configuration');
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('Starting to fetch mystery box and prizes...', { 
        mysteryBoxId, 
        accountName,
        currentState: {
          mysteryBox: mysteryBox ? 'exists' : 'null',
          prizesCount: prizes.length,
          isLoading
        }
      });

      const [mysteryBoxResponse, prizesResponse] = await Promise.all([
        fetch(`https://api.gamelayer.co/api/v0/mysteryboxes/${mysteryBoxId}`, {
          headers: {
            'api-key': apiKey,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`https://api.gamelayer.co/api/v0/mysteryboxes/${mysteryBoxId}/prizes`, {
          headers: {
            'api-key': apiKey,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (!mysteryBoxResponse.ok) {
        const errorText = await mysteryBoxResponse.text();
        console.error('Mystery box API error:', {
          status: mysteryBoxResponse.status,
          statusText: mysteryBoxResponse.statusText,
          body: errorText,
          url: mysteryBoxResponse.url
        });
        throw new Error(`Failed to fetch mystery box: ${mysteryBoxResponse.status} ${mysteryBoxResponse.statusText}`);
      }

      if (!prizesResponse.ok) {
        const errorText = await prizesResponse.text();
        console.error('Prizes API error:', {
          status: prizesResponse.status,
          statusText: prizesResponse.statusText,
          body: errorText,
          url: prizesResponse.url
        });
        throw new Error(`Failed to fetch prizes: ${prizesResponse.status} ${prizesResponse.statusText}`);
      }

      const [mysteryBoxData, prizesData] = await Promise.all([
        mysteryBoxResponse.json(),
        prizesResponse.json()
      ]);

      console.log('API responses received:', { 
        mysteryBoxData: {
          code: mysteryBoxData.code,
          hasMysteryBox: !!mysteryBoxData.mysterybox,
          mysteryBoxId: mysteryBoxData.mysterybox?.id,
          isAvailable: mysteryBoxData.mysterybox?.isAvailable
        },
        prizesData: {
          code: prizesData.code,
          prizesCount: prizesData.prizes?.length || 0
        }
      });

      if (mysteryBoxData.code === 1 && mysteryBoxData.mysterybox) {
        setMysteryBox(mysteryBoxData.mysterybox);
        console.log('Mystery box state updated:', {
          id: mysteryBoxData.mysterybox.id,
          name: mysteryBoxData.mysterybox.name,
          isAvailable: mysteryBoxData.mysterybox.isAvailable
        });
      } else {
        console.error('Invalid mystery box response:', mysteryBoxData);
        toast.error(mysteryBoxData.message || 'Failed to load mystery box');
      }

      if (prizesData.code === 1 && Array.isArray(prizesData.prizes)) {
        setPrizes(prizesData.prizes);
        console.log('Prizes state updated:', {
          count: prizesData.prizes.length,
          prizeIds: prizesData.prizes.map((p: Prize) => p.id)
        });
      } else {
        console.error('Invalid prizes response:', prizesData);
        toast.error(prizesData.message || 'Failed to load prizes');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
      console.log('Fetch completed. Current state:', {
        isLoading: false,
        hasMysteryBox: !!mysteryBox,
        prizesCount: prizes.length
      });
    }
  };

  const calculateTargetRotation = (prize: Prize) => {
    const prizeIndex = prizes.findIndex(p => p.id === prize.id)
    return 360 * 5 + (360 / prizes.length) * prizeIndex
  }

  const animate = async (targetRotation: number) => {
    if (!wheelRef.current) return;
    
    const startRotation = wheelRotation;
    const startTime = performance.now();
    const duration = 5000; // 5 seconds
    const easing = (t: number) => 1 - Math.pow(1 - t, 3); // Cubic ease-out

    return new Promise<void>((resolve) => {
      const animateFrame = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easing(progress);
        
        const newRotation = startRotation + (targetRotation - startRotation) * easedProgress;
        setWheelRotation(newRotation);

        if (progress < 1) {
          requestAnimationFrame(animateFrame);
        } else {
          // Animation complete
          resolve();
        }
      };

      requestAnimationFrame(animateFrame);
    });
  };

  const handleSpin = async () => {
    if (!mysteryBox || isSpinning) return;

    try {
      setIsSpinning(true);

      // Get a random prize
      const availablePrizes = prizes.filter(p => !wonPrizes.includes(p.id));
      if (availablePrizes.length === 0) {
        toast.error('No more prizes available!');
        setIsSpinning(false);
        return;
      }

      const randomIndex = Math.floor(Math.random() * availablePrizes.length);
      const prize = availablePrizes[randomIndex];

      // Update state before animation
      setSelectedPrize(prize);
      setWonPrizes(prev => [...prev, prize.id]);

      // Start the animation
      const wheel = document.getElementById('prize-wheel');
      if (wheel) {
        const currentRotation = getCurrentRotation(wheel);
        const targetRotation = currentRotation + 1800 + (randomIndex * (360 / prizes.length));
        wheel.style.transition = 'transform 5s cubic-bezier(0.17, 0.67, 0.83, 0.67)';
        wheel.style.transform = `rotate(${targetRotation}deg)`;
      }

      // Wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Claim the prize
      const claimResponse = await fetch(`https://api.gamelayer.co/api/v0/mysteryboxes/${mysteryBox.id}/prizes/${prize.id}/claim`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': apiKey
        },
        body: JSON.stringify({ playerId })
      });

      if (!claimResponse.ok) {
        throw new Error('Failed to claim prize');
      }

      const claimData = await claimResponse.json();
      console.log('Prize claimed:', claimData);

      // Update credits
      setCredits(claimData.credits || 0);
      toast.success(`You won: ${prize.name}`);

      // Use Promise.resolve().then() to ensure state updates are complete before fetching new data
      Promise.resolve().then(() => {
        fetchMysteryBoxAndPrizes();
        if (onEventCompleted) {
          onEventCompleted();
        }
      });

    } catch (error) {
      console.error('Error during spin:', error);
      toast.error('Failed to claim prize. Please try again.');
    } finally {
      setIsSpinning(false);
    }
  };

  const getCurrentRotation = (element: HTMLElement): number => {
    const transform = window.getComputedStyle(element).transform;
    const matrix = new DOMMatrix(transform);
    const angle = Math.round(Math.atan2(matrix.m21, matrix.m11) * (180/Math.PI));
    return angle < 0 ? angle + 360 : angle;
  };

  // Add debug logging for render conditions
  useEffect(() => {
    console.log('Render conditions:', {
      isLoading,
      hasMysteryBox: !!mysteryBox,
      prizesCount: prizes.length,
      mysteryBoxId,
      playerId,
      accountName
    });
  }, [isLoading, mysteryBox, prizes, mysteryBoxId, playerId, accountName]);

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded mb-4"></div>
        <div className="h-10 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!mysteryBox || !prizes || prizes.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center text-gray-500">
          <p>No mystery box or prizes available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 px-4">{mysteryBox?.name}</h2>
      <div className="w-full p-4 sm:p-6 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
        <div className="space-y-6">
          {/* Header with Description and Credits */}
          <div className="space-y-3">
            <p className="text-sm text-gray-600">{mysteryBox?.description}</p>
            <div className="flex justify-end">
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full">
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1.003-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.547.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.264-.521H10a1 1 0 100-2H8.017a7.36 7.36 0 010-1H10a1 1 0 100-2H8.472c.08-.185.167-.36.264-.521z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-blue-700">{mysteryBox?.credits} credits</span>
              </div>
            </div>
          </div>

          {/* Prize Wheel */}
          <div className="relative w-full aspect-square max-w-sm mx-auto">
            <div 
              ref={wheelRef}
              className="absolute inset-0 rounded-full border-8 border-gray-200 bg-gradient-to-br from-purple-100 to-blue-100 transition-transform duration-3000 ease-out"
              style={{ transform: `rotate(${wheelRotation}deg)` }}
            >
              {/* Segment Dividers */}
              {prizes.map((_, index) => {
                const angle = (360 / prizes.length) * index
                return (
                  <div
                    key={`divider-${index}`}
                    className="absolute inset-0"
                    style={{
                      transform: `rotate(${angle}deg)`,
                      transformOrigin: 'center'
                    }}
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-1/2 bg-gray-300" />
                  </div>
                )
              })}

              {/* Prize Segments */}
              {prizes.map((prize, index) => {
                const angle = (360 / prizes.length) * index
                const segmentAngle = 360 / prizes.length
                const imageAngle = angle + (segmentAngle / 2) // Center the image in the segment
                return (
                  <div
                    key={prize.id}
                    className="absolute inset-0"
                    style={{
                      transform: `rotate(${imageAngle}deg)`,
                      transformOrigin: 'center'
                    }}
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 origin-bottom-right">
                      <div className="relative w-full h-full">
                        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                          {prize.imgUrl ? (
                            <img 
                              src={prize.imgUrl} 
                              alt={prize.name}
                              className="w-8 h-8 object-contain"
                            />
                          ) : (
                            <span className="text-2xl">🎁</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {/* Center Point */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border-4 border-gray-300 shadow-lg" />
            </div>
            
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[24px] border-l-transparent border-r-transparent border-t-red-500" />
          </div>

          {/* Spin Button */}
          <div className="flex justify-center">
            <button
              onClick={handleSpin}
              disabled={isSpinning || !mysteryBox?.isAvailable || credits < (mysteryBox?.credits || 10)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                isSpinning
                  ? 'bg-gray-100 text-gray-500 cursor-wait'
                  : !mysteryBox?.isAvailable
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  : credits < (mysteryBox?.credits || 10)
                  ? 'bg-red-100 text-red-500 cursor-not-allowed'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              {isSpinning ? (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Spinning...
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {credits < (mysteryBox?.credits || 10) ? 'Need More Credits' : 'Spin'}
                </span>
              )}
            </button>
          </div>

          {/* Prize List */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-900">Available Prizes</h3>
            <div className="grid grid-cols-2 gap-2">
              {prizes.map((prize) => (
                <div
                  key={prize.id}
                  className={`relative flex flex-col items-center p-4 rounded-lg ${
                    wonPrizes.includes(prize.id)
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  {wonPrizes.includes(prize.id) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                      <svg 
                        className="w-8 h-8 text-green-500" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M5 13l4 4L19 7" 
                        />
                      </svg>
                    </div>
                  )}
                  {prize.imgUrl && (
                    <div className="relative w-16 h-16 mb-2">
                      <Image
                        src={prize.imgUrl}
                        alt={prize.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}
                  <h3 className="text-sm font-medium text-gray-900 text-center">{prize.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {prize.stock > 0 ? `${prize.stock} remaining` : 'Out of stock'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MysteryCard 