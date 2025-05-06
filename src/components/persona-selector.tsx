import { Persona } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface PersonaSelectorProps {
  personas: Persona[];
  selectedPersona: Persona;
  setSelectedPersona: (persona: Persona) => void;
}

export default function PersonaSelector({
  personas,
  selectedPersona,
  setSelectedPersona,
}: PersonaSelectorProps) {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-sm font-medium text-muted-foreground">
        Choose a persona
      </h2>
      <div className="space-y-2">
        {personas.map((persona) => (
          <Button
            key={persona.id}
            variant={selectedPersona.id === persona.id ? "secondary" : "ghost"}
            className="w-full justify-start gap-2 h-auto py-3"
            onClick={() => setSelectedPersona(persona)}
          >
            <img
              src={persona.avatar_url || "/placeholder.svg"}
              alt={persona.name}
              className="h-8 w-8 rounded-full"
            />
            <div className="text-left">
              <div className="font-medium">{persona.name}</div>
              <div className="text-xs text-muted-foreground line-clamp-1">
                {persona.description}
              </div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}
