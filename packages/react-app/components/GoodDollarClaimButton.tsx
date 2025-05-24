import { useGoodDollarClaim } from '../hooks/useGoodDollarClaim';
import { Button } from './ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/ui/tooltip';
import { Gift } from 'lucide-react';

export const GoodDollarClaimButton = () => {
  const {
    canClaim,
    claimAmount,
    nextClaimTime,
    isLoading,
    error,
    claim,
  } = useGoodDollarClaim();

  const handleClaim = async () => {
    try {
      await claim();
    } catch (error) {
      console.error('Claim failed:', error);
    }
  };

  const tooltipContent = canClaim 
    ? `Claim ${claimAmount} G$ now`
    : nextClaimTime 
      ? `Next claim available ${formatDistanceToNow(nextClaimTime, { addSuffix: true })}`
      : 'Checking eligibility...';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleClaim}
            disabled={!canClaim || isLoading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Gift className="h-4 w-4" />
            {isLoading ? 'Claiming...' : 'Claim G$'}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipContent}</p>
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}; 