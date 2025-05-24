import { useGoodDollarClaim } from '../hooks/useGoodDollarClaim';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { formatDistanceToNow } from 'date-fns';
import { useAccount } from 'wagmi';

export const GoodDollarClaim = () => {
  const { address } = useAccount();
  const {
    canClaim,
    claimAmount,
    nextClaimTime,
    isLoading,
    error,
    claim,
    isInitialized,
  } = useGoodDollarClaim();

  const handleClaim = async () => {
    try {
      await claim();
    } catch (error) {
      // Error is handled by the hook
      console.error('Claim failed:', error);
    }
  };

  if (!address) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Claim GoodDollar (G$)</CardTitle>
          <CardDescription>
            Connect your wallet to claim your daily Universal Basic Income
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!isInitialized) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Claim GoodDollar (G$)</CardTitle>
          <CardDescription>
            Initializing GoodDollar connection...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Claim GoodDollar (G$)</CardTitle>
        <CardDescription>
          Claim your daily Universal Basic Income in G$ tokens
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <div className="text-sm text-muted-foreground">
              {canClaim ? (
                <span>You can claim {claimAmount} G$ now</span>
              ) : nextClaimTime ? (
                <span>
                  Next claim available in{' '}
                  {formatDistanceToNow(nextClaimTime, { addSuffix: true })}
                </span>
              ) : (
                <span>Checking eligibility...</span>
              )}
            </div>
            
            {error && (
              <div className="text-sm text-red-500">
                {error}
              </div>
            )}
          </div>

          <Button
            onClick={handleClaim}
            disabled={!canClaim || isLoading}
            className="w-full"
          >
            {isLoading ? (
              'Processing...'
            ) : canClaim ? (
              `Claim ${claimAmount} G$`
            ) : (
              'Not Available'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 