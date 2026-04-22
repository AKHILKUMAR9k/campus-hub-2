import Link from "next/link";
import { Users, Calendar } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Club {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  logo: string | null;
  organizer_id: string | null;
}

interface ClubCardProps {
  club: Club;
}

export default function ClubCard({ club }: ClubCardProps) {
  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
        <Avatar className="h-12 w-12">
          {club.logo && <AvatarImage src={club.logo} alt={club.name} />}
          <AvatarFallback>{club.name.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="text-xl line-clamp-1">{club.name}</CardTitle>
          {club.category && (
            <Badge variant="secondary" className="mt-1">
              {club.category}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-4">
        <p className="text-muted-foreground line-clamp-3 text-sm">
          {club.description || "No description available."}
        </p>
      </CardContent>
      <CardFooter className="pt-4 border-t bg-muted/20">
        <Button asChild className="w-full">
          <Link href={`/dashboard/clubs/${club.id}`}>
            View Club
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
