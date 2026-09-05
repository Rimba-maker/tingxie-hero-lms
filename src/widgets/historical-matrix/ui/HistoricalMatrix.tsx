import { Check, X } from "lucide-react";

import type { CharacterHistoryMatrix } from "@/entities/character-result/api/buildCharacterHistoryMatrix";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

type HistoricalMatrixProps = {
  matrix: CharacterHistoryMatrix;
  pinyinByCharacter?: Map<string, string>;
};

export function HistoricalMatrix({ matrix, pinyinByCharacter }: HistoricalMatrixProps) {
  if (matrix.rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No history yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Character</TableHead>
          {matrix.dates.map((date) => (
            <TableHead key={date} className="text-center">
              {new Date(date).toLocaleDateString("en-SG", { day: "numeric", month: "short" })}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {matrix.rows.map((row) => (
          <TableRow key={row.character}>
            <TableCell className="font-medium">
              {row.character}
              {pinyinByCharacter?.get(row.character) && (
                <span className="block text-xs font-normal text-muted-foreground">
                  {pinyinByCharacter.get(row.character)}
                </span>
              )}
            </TableCell>
            {matrix.dates.map((date) => (
              <TableCell key={date} className="text-center">
                {row.resultsByDate[date] === undefined ? (
                  <span className="text-muted-foreground" aria-label="Not attempted">
                    —
                  </span>
                ) : row.resultsByDate[date] ? (
                  <Check className="mx-auto size-4 text-success" aria-label="Correct" role="img" />
                ) : (
                  <X className="mx-auto size-4 text-destructive" aria-label="Incorrect" role="img" />
                )}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
