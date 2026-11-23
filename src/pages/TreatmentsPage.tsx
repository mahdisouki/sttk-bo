import { useMemo, useState } from "react";
import { useAuth } from "../lib/auth";
import { createAdminApi } from "../lib/adminApi";
import { useQuery } from "../hooks/useQuery";
import { ApiError } from "../lib/api";
import { millimesToTnd, slugify, tndToMillimes } from "../lib/format";
import { Button } from "../components/Button";
import { PageSkeleton } from "../components/PageSkeleton";
import { Status } from "../components/Status";

const CATEGORIES = [
  { id: "baths", label: "Bains" },
  { id: "showers", label: "Douches" },
  { id: "body", label: "Soins du corps" },
  { id: "wellness", label: "Bien-être" },
];

function categoryLabel(id: string) {
  return CATEGORIES.find((item) => item.id === id)?.label || id;
}

export default function TreatmentsPage({ role }: { role: "admin" | "agent" }) {
  const { authFetch } = useAuth();
  const api = useMemo(() => createAdminApi(authFetch), [authFetch]);
  const { data, loading, error, reload } = useQuery(async () => {
    const result = await api.treatments();
    return result.data || [];
  }, [api]);
  const [editing, setEditing] = useState<any | "new" | null>(null);

  if (editing !== null) {
    return (
      <TreatmentForm
        item={editing === "new" ? null : editing}
        role={role}
        back={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          reload();
        }}
      />
    );
  }
  if (loading) return <PageSkeleton />;
  if (error) return <div className="error-note">{error}</div>;
  const rows = data || [];
  return (
    <div className="stack">
      <div className="toolbar">
        <span className="spacer" />
        {role === "admin" && (
          <Button icon="plus" onClick={() => setEditing("new")}>
            Nouveau soin
          </Button>
        )}
      </div>
      <section className="card table-card">
        <div className="table-title">
          <div>
            <h3>Fiches soins</h3>
            <p>Seuls les soins publiés apparaissent sur le site.</p>
          </div>
        </div>
        {!rows.length && <div className="empty-note muted">Aucun soin pour le moment.</div>}
        {!!rows.length && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>SOIN</th>
                  <th>CATÉGORIE</th>
                  <th>DURÉE</th>
                  <th>TARIF</th>
                  <th>STATUT</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row: any) => (
                  <tr key={String(row._id)} onClick={() => setEditing(row)}>
                    <td>
                      <b>{row.name || row.slug}</b>
                      {row.featured ? <small className="muted"> · Mis en avant</small> : null}
                    </td>
                    <td>{categoryLabel(row.category)}</td>
                    <td>{row.duration}</td>
                    <td>{row.publicPrice == null ? "—" : millimesToTnd(row.publicPrice)}</td>
                    <td>
                      <Status value={row.status} />
                    </td>
                    <td>
                      <button type="button" onClick={() => setEditing(row)}>
                        {role === "admin" ? "Modifier" : "Voir"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function field(item: any, locale: "fr" | "ar" | "en", name: string) {
  return item?.translations?.[locale]?.[name] || "";
}

function TreatmentForm({
  item,
  role,
  back,
  onSaved,
}: {
  item: any | null;
  role: "admin" | "agent";
  back: () => void;
  onSaved: () => void;
}) {
  const { authFetch } = useAuth();
  const api = useMemo(() => createAdminApi(authFetch), [authFetch]);
  const isNew = !item;
  const readOnly = role !== "admin";
  const [nameFr, setNameFr] = useState(field(item, "fr", "name"));
  const [slug, setSlug] = useState(item?.slug || "");
  const [slugTouched, setSlugTouched] = useState(Boolean(item?.slug));
  const [category, setCategory] = useState(item?.category || "baths");
  const [duration, setDuration] = useState(item?.duration || "");
  const [price, setPrice] = useState(item?.publicPrice == null ? "" : millimesInput(item.publicPrice));
  const [featured, setFeatured] = useState(Boolean(item?.featured));
  const [summaryFr, setSummaryFr] = useState(field(item, "fr", "summary"));
  const [descriptionFr, setDescriptionFr] = useState(field(item, "fr", "description"));
  const [benefitsFr, setBenefitsFr] = useState(field(item, "fr", "benefits"));
  const [characteristicsFr, setCharacteristicsFr] = useState(field(item, "fr", "characteristics"));
  const [infoFr, setInfoFr] = useState(field(item, "fr", "info"));
  const [localeTab, setLocaleTab] = useState<"ar" | "en">("ar");
  const [nameAr, setNameAr] = useState(field(item, "ar", "name"));
  const [summaryAr, setSummaryAr] = useState(field(item, "ar", "summary"));
  const [descriptionAr, setDescriptionAr] = useState(field(item, "ar", "description"));
  const [nameEn, setNameEn] = useState(field(item, "en", "name"));
  const [summaryEn, setSummaryEn] = useState(field(item, "en", "summary"));
  const [descriptionEn, setDescriptionEn] = useState(field(item, "en", "description"));
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function pack() {
    const translations: Record<string, Record<string, string>> = {
      fr: {
        name: nameFr.trim(),
        summary: summaryFr.trim(),
        description: descriptionFr.trim(),
        benefits: benefitsFr.trim(),
        characteristics: characteristicsFr.trim(),
        info: infoFr.trim(),
      },
    };
    if (nameAr.trim() || summaryAr.trim() || descriptionAr.trim()) {
      translations.ar = { name: nameAr.trim(), summary: summaryAr.trim(), description: descriptionAr.trim() };
    }
    if (nameEn.trim() || summaryEn.trim() || descriptionEn.trim()) {
      translations.en = { name: nameEn.trim(), summary: summaryEn.trim(), description: descriptionEn.trim() };
    }
    const body: Record<string, unknown> = {
      category,
      duration: duration.trim(),
      featured,
      publicPrice: price.trim() ? tndToMillimes(price) : null,
      translations,
    };
    if (isNew) body.slug = (slug || slugify(nameFr)).trim().toLowerCase();
    return body;
  }

  async function save(andPublish: boolean) {
    if (readOnly) return;
    setBusy(true);
    setError("");
    try {
      const body = pack();
      let id = item ? String(item._id) : "";
      if (isNew) {
        const created = await api.createTreatment(body);
        id = String((created as any).data?._id || (created as any)._id);
      } else {
        await api.updateTreatment(id, body);
      }
      if (photoFile) await api.uploadTreatmentPhoto(id, photoFile);
      if (andPublish) await api.publishTreatment(id);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Enregistrement impossible");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (readOnly || !item) return;
    if (!window.confirm("Supprimer ce soin ?")) return;
    setBusy(true);
    setError("");
    try {
      await api.deleteTreatment(String(item._id));
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Suppression impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <button className="back" type="button" onClick={back}>
        ← Retour aux soins
      </button>
      <div className="detail-head">
        <div>
          <h2>{isNew ? "Nouveau soin" : "Modifier le soin"}</h2>
          <p>{item ? `Statut : ${item.status}` : "Le soin sera créé en brouillon."}</p>
        </div>
        {!readOnly && (
          <div className="actions">
            <Button variant="secondary" disabled={busy} onClick={() => save(false)}>
              Enregistrer
            </Button>
            <Button disabled={busy} onClick={() => save(true)}>
              Publier
            </Button>
          </div>
        )}
      </div>
      {error && <div className="error-note">{error}</div>}
      <section className="card form-card">
        <div className="field-grid">
          <label>
            Nom en français *
            <input
              value={nameFr}
              disabled={readOnly}
              onChange={(e) => {
                setNameFr(e.target.value);
                if (!slugTouched && isNew) setSlug(slugify(e.target.value));
              }}
            />
          </label>
          <label>
            Slug
            <input
              value={slug}
              disabled={readOnly || !isNew}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
            />
          </label>
          <label>
            Catégorie
            <select value={category} disabled={readOnly} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Durée
            <input value={duration} disabled={readOnly} onChange={(e) => setDuration(e.target.value)} placeholder="45 min" />
          </label>
          <label>
            Tarif public
            <input value={price} disabled={readOnly} onChange={(e) => setPrice(e.target.value)} placeholder="Laisser vide si non affiché" />
            <span className="input-unit">TND</span>
          </label>
          <label>
            Mise en avant
            <select
              value={featured ? "yes" : "no"}
              disabled={readOnly}
              onChange={(e) => setFeatured(e.target.value === "yes")}
            >
              <option value="no">Non</option>
              <option value="yes">Oui, sur l’accueil</option>
            </select>
          </label>
          <label className="full">
            Résumé
            <textarea value={summaryFr} disabled={readOnly} onChange={(e) => setSummaryFr(e.target.value)} />
          </label>
          <label className="full">
            Description
            <textarea value={descriptionFr} disabled={readOnly} onChange={(e) => setDescriptionFr(e.target.value)} />
          </label>
          <label className="full">
            Bienfaits (une ligne par point)
            <textarea value={benefitsFr} disabled={readOnly} onChange={(e) => setBenefitsFr(e.target.value)} />
          </label>
          <label className="full">
            Caractéristiques (une ligne par point)
            <textarea value={characteristicsFr} disabled={readOnly} onChange={(e) => setCharacteristicsFr(e.target.value)} />
          </label>
          <label className="full">
            Bon à savoir
            <textarea value={infoFr} disabled={readOnly} onChange={(e) => setInfoFr(e.target.value)} />
          </label>
        </div>
      </section>
      <section className="card form-card">
        <div className="card-head">
          <h3>Traductions</h3>
        </div>
        <div className="tabs">
          <button type="button" className={localeTab === "ar" ? "active" : ""} onClick={() => setLocaleTab("ar")}>
            Arabe
          </button>
          <button type="button" className={localeTab === "en" ? "active" : ""} onClick={() => setLocaleTab("en")}>
            Anglais
          </button>
        </div>
        {localeTab === "ar" ? (
          <>
            <label>
              Nom
              <input dir="rtl" value={nameAr} disabled={readOnly} onChange={(e) => setNameAr(e.target.value)} />
            </label>
            <label>
              Résumé
              <textarea dir="rtl" value={summaryAr} disabled={readOnly} onChange={(e) => setSummaryAr(e.target.value)} />
            </label>
            <label>
              Description
              <textarea dir="rtl" value={descriptionAr} disabled={readOnly} onChange={(e) => setDescriptionAr(e.target.value)} />
            </label>
          </>
        ) : (
          <>
            <label>
              Nom
              <input value={nameEn} disabled={readOnly} onChange={(e) => setNameEn(e.target.value)} />
            </label>
            <label>
              Résumé
              <textarea value={summaryEn} disabled={readOnly} onChange={(e) => setSummaryEn(e.target.value)} />
            </label>
            <label>
              Description
              <textarea value={descriptionEn} disabled={readOnly} onChange={(e) => setDescriptionEn(e.target.value)} />
            </label>
          </>
        )}
      </section>
      {!readOnly && (
        <section className="card form-card">
          <h3>Photo</h3>
          <label className="upload" style={{ cursor: "pointer" }}>
            <b>{photoFile ? photoFile.name : "Ajouter une photo"}</b>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
            />
          </label>
          {!isNew && (
            <button className="delete-link" type="button" disabled={busy} onClick={remove}>
              Supprimer ce soin
            </button>
          )}
        </section>
      )}
    </div>
  );
}

function millimesInput(value: number) {
  return (Number(value) / 1000).toLocaleString("fr-TN", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}
