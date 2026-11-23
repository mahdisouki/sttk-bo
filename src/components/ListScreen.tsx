import type { ReactNode } from "react";
import { Button } from "./Button";
import { Icon } from "./Icon";

export function ListScreen({
  button,
  columns,
  rows,
  tabs = false,
  onRow,
}: {
  button?: string;
  columns: string[];
  rows: ReactNode[][];
  tabs?: boolean;
  onRow?: () => void;
}) {
  return (
    <div className="stack">
      <div className="toolbar">
        {tabs ? (
          <div className="tabs">
            <button className="active">
              Tous <span>{rows.length}</span>
            </button>
            <button>
              En attente <span>1</span>
            </button>
            <button>Approuvés</button>
            <button>Bloqués</button>
          </div>
        ) : (
          <div className="search-box">
            <Icon name="search" />
            <input placeholder="Rechercher…" />
          </div>
        )}
        <span className="spacer" />
        {button && <Button icon="plus">{button}</Button>}
      </div>
      <section className="card table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {columns.map((c, i) => (
                  <th key={i}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} onClick={onRow}>
                  {r.map((c, j) => (
                    <td key={j}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <span>{rows.length} éléments</span>
          <div>
            <button className="active">1</button>
          </div>
        </div>
      </section>
    </div>
  );
}
