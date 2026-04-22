import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export function EventCardSkeleton() {
  return (
    <Card className="flex flex-col overflow-hidden h-full">
      <CardHeader className="p-0">
        <Skeleton className="h-48 w-full" />
      </CardHeader>
      <CardContent className="p-4 flex-grow space-y-4">
        <div className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
        </div>
      </CardContent>
      <CardFooter className="p-4 bg-muted/30">
        <div className="flex justify-between w-full items-center">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-9 w-24" />
        </div>
      </CardFooter>
    </Card>
  );
}

export function ClubCardSkeleton() {
    return (
      <Card className="flex flex-col overflow-hidden h-full">
        <CardHeader className="flex flex-row items-center gap-4 p-6">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-20" />
            </div>
        </CardHeader>
        <CardContent className="p-6 pt-0 flex-grow space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </CardContent>
        <CardFooter className="p-6 pt-0">
             <Skeleton className="h-9 w-full" />
        </CardFooter>
      </Card>
    );
  }
  
  export function DashboardSkeleton() {
      return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                  <EventCardSkeleton key={i} />
              ))}
          </div>
      )
  }
