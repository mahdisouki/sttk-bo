import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../lib/auth";
import { createAdminApi } from "../lib/adminApi";
import { useQuery } from "../hooks/useQuery";
import { ApiError } from "../lib/api";
import {
  formatDateTime,
  millimesToTnd,
  slugify,
  tndToMillimes,
} from "../lib/format";
import { useUiStore } from "../stores/uiStore";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { Info } from "../components/Info";
import { PageSkeleton } from "../components/PageSkeleton";
import { Status } from "../components/Status";

const API_BASE = (import.meta.env.VITE_API_URL || "/api/v1").replace(/\/$/, "");

function VoucherPhotoThumb({
  voucherId,
  index,
  photoKey,
  token,
}: {
  voucherId: string;
  index: number;
  photoKey: string;
  token: string | null;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let alive = true;
    if (!token) return;
    (async () => {
      try {
        const response = await fetch(
          `${API_BASE}/admin/voucher-types/${voucherId}/photos/${index}?t=${encodeURIComponent(photoKey)}`,
          {
            headers: { Authorization: `Bearer ${token}`, Accept: "*/*" },
          },
        );
        if (!response.ok) throw new Error("photo");
        const blob = await response.blob();
        if (!alive) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      } catch {
        if (alive) setSrc(null);
      }
    })();
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [voucherId, index, photoKey, token]);

  if (!src) {
    return (
      <div className="photo-fallback">
        <Icon name="ticket" />
        <small>{photoKey.split("/").pop()}</small>
      </div>
    );
  }
  return <img src={src} alt="Photo du bon" />;
}

export default function CataloguePage({ role }: { role: "admin" | "agent" }) {
  const openModal = useUiStore((s) => s.openModal);
  const { authFetch } = useAuth();
  const api = useMemo(() => createAdminApi(authFetch), [authFetch]);
  const { data, loading, error, reload } = useQuery(async () => {
    const result = await api.voucherTypes();
    return result.data || [];
  }, [api]);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const [busyId, setBusyId] = useState("");

  if (editingId !== null) {
    const item = editingId === "new" ? null : (data || []).find((row: any) => String(row._id) === editingId);
    return (
      <VoucherForm
        item={item || null}
        role={role}
        back={() => setEditingId(null)}
        onSaved={() => {
          setEditingId(null);
          reload();
        }}
      />
    );
  }

  if (loading) return <PageSkeleton />;
  if (error) return <div className="error-note">{error}</div>;

  const items = (data || []).map((item: any) => ({
    id: String(item._id || item.id),
    name: item.name || item.slug,
    slug: item.slug,
    publicPrice: millimesToTnd(item.publicPrice),
    wholesalePrice: item.wholesalePrice != null ? millimesToTnd(item.wholesalePrice) : "—",
    status: item.status,
    vat: item.vatRateBps,
    photos: item.photos || [],
  }));
  const visible = items.filter((i) => filter === "all" || i.status === filter);

  async function publish(id: string) {
    setBusyId(id);
    try {
      await api.publishVoucher(id);
      reload();
      openModal("publish");
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : "Publication impossible");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="stack">
      <div className="toolbar">
        <div className="tabs">
          <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>
            Tous <span>{items.length}</span>
          </button>
          <button className={filter === "published" ? "active" : ""} onClick={() => setFilter("published")}>
            Publiés <span>{items.filter((i) => i.status === "published").length}</span>
          </button>
          <button className={filter === "draft" ? "active" : ""} onClick={() => setFilter("draft")}>
            Brouillons <span>{items.filter((i) => i.status === "draft").length}</span>
          </button>
        </div>
        <span className="spacer" />
        {role === "admin" && (
          <Button icon="plus" onClick={() => setEditingId("new")}>
            Nouveau type de bon
          </Button>
        )}
      </div>
      {!visible.length && <div className="empty-note muted">Aucun type de bon dans ce filtre.</div>}
      <div className="catalogue-grid">
        {visible.map((i, n) => (
          <article className="voucher-card card" key={i.id}>
            <div className={`voucher-art art-${n % 3}`}>
              <span className="brand-mark">
                <img src="/logo-sttk.png" alt="" />
              </span>
              <Icon name="ticket" size={34} />
            </div>
            <div className="voucher-body">
              <div className="card-head">
                <Status value={i.status} />
              </div>
              <h3>{i.name}</h3>
              <code>{i.slug}</code>
              <div className="prices">
                <Info label="Prix public" value={i.publicPrice} />
                <Info label="Prix grossiste" value={i.wholesalePrice} />
              </div>
              <div className="card-foot">
                <span>TVA {(i.vat / 100).toFixed(0)} %</span>
                {role === "admin" && i.status === "draft" ? (
                  <button disabled={busyId === i.id} onClick={() => publish(i.id)}>
                    Publier <Icon name="chevron" size={14} />
                  </button>
                ) : (
                  <button onClick={() => setEditingId(i.id)}>
                    {role === "admin" ? "Modifier" : "Voir"} <Icon name="chevron" size={14} />
                  </button>
                )}
                {role === "admin" && i.status === "draft" && (
                  <button onClick={() => setEditingId(i.id)}>Modifier</button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function millimesInputValue(value: number | null | undefined): string {
  if (value == null) return "";
  return (Number(value) / 1000).toLocaleString("fr-TN", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

function VoucherForm({
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
  const openModal = useUiStore((s) => s.openModal);
  const { authFetch, accessToken } = useAuth();
  const api = useMemo(() => createAdminApi(authFetch), [authFetch]);
  const isNew = !item;
  const readOnly = role !== "admin";

  const [nameFr, setNameFr] = useState(item?.translations?.fr?.name || item?.name || "");
  const [slug, setSlug] = useState(item?.slug || "");
  const [slugTouched, setSlugTouched] = useState(Boolean(item?.slug));
  const [descriptionFr, setDescriptionFr] = useState(
    item?.translations?.fr?.description || item?.description || "",
  );
  const [duration, setDuration] = useState(String(item?.duration ?? 180));
  const [vatRateBps, setVatRateBps] = useState(String(item?.vatRateBps ?? 1900));
  const [publicPrice, setPublicPrice] = useState(millimesInputValue(item?.publicPrice ?? 45000));
  const [wholesalePrice, setWholesalePrice] = useState(millimesInputValue(item?.wholesalePrice));
  const [localeTab, setLocaleTab] = useState<"ar" | "en">("ar");
  const [nameAr, setNameAr] = useState(item?.translations?.ar?.name || "");
  const [descriptionAr, setDescriptionAr] = useState(item?.translations?.ar?.description || "");
  const [nameEn, setNameEn] = useState(item?.translations?.en?.name || "");
  const [descriptionEn, setDescriptionEn] = useState(item?.translations?.en?.description || "");
  const [photos, setPhotos] = useState<string[]>(
    (item?.photos || []).map((photo: string) => String(photo).replace(/\\/g, "/")),
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const voucherId = item ? String(item._id) : "";

  function pickPhoto(file: File | null) {
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
    setPhotoFile(file);
  }

  async function removeExistingPhoto(photo: string) {
    if (readOnly || !voucherId) return;
    setBusy(true);
    setError("");
    try {
      await api.deleteVoucherPhoto(voucherId, photo);
      setPhotos((current) => current.filter((entry) => entry !== photo));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Suppression de la photo impossible");
    } finally {
      setBusy(false);
    }
  }

  function buildBody() {
    const translations: Record<string, { name?: string; description?: string }> = {
      fr: { name: nameFr.trim(), description: descriptionFr.trim() },
    };
    if (nameAr.trim() || descriptionAr.trim()) {
      translations.ar = { name: nameAr.trim(), description: descriptionAr.trim() };
    }
    if (nameEn.trim() || descriptionEn.trim()) {
      translations.en = { name: nameEn.trim(), description: descriptionEn.trim() };
    }
    const body: Record<string, unknown> = {
      duration: Number(duration),
      vatRateBps: Number(vatRateBps),
      publicPrice: tndToMillimes(publicPrice),
      translations,
    };
    if (wholesalePrice.trim()) body.wholesalePrice = tndToMillimes(wholesalePrice);
    if (isNew) body.slug = (slug || slugify(nameFr)).trim().toLowerCase();
    return body;
  }

  async function save(andPublish: boolean) {
    if (readOnly) return;
    setBusy(true);
    setError("");
    try {
      const body = buildBody();
      let id = item ? String(item._id) : "";
      if (isNew) {
        const created = await api.createVoucherType(body);
        id = String((created as any).data?._id || (created as any)._id);
      } else {
        await api.updateVoucherType(id, body);
      }
      if (photoFile) {
        // Replace cover: drop remaining stored photos, then upload the new one.
        for (const photo of photos) {
          try {
            await api.deleteVoucherPhoto(id, photo);
          } catch {
            // continue replacing even if one old file is already gone
          }
        }
        await api.uploadVoucherPhoto(id, photoFile);
      }
      if (andPublish) {
        await api.publishVoucher(id);
        openModal("publish");
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Enregistrement impossible");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (readOnly || !item) return;
    if (!window.confirm("Supprimer ce type de bon ?")) return;
    setBusy(true);
    setError("");
    try {
      await api.deleteVoucherType(String(item._id));
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Suppression impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <button className="back" onClick={back}>
        ← Retour au catalogue
      </button>
      <div className="detail-head">
        <div>
          <h2>{isNew ? "Nouveau type de bon" : "Modifier le type de bon"}</h2>
          <p>
            {item
              ? `Statut : ${item.status}${item.updatedAt ? ` · Mis à jour le ${formatDateTime(item.updatedAt)}` : ""}`
              : "Le bon sera créé en brouillon."}
          </p>
        </div>
        {!readOnly && (
          <div className="actions">
            <Button variant="secondary" disabled={busy} onClick={() => save(false)}>
              Enregistrer le brouillon
            </Button>
            <Button disabled={busy} onClick={() => save(true)}>
              Publier
            </Button>
          </div>
        )}
      </div>
      {error && <div className="error-note">{error}</div>}
      <div className="form-layout">
        <div className="stack">
          <section className="card form-card">
            <h3>Informations générales</h3>
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
              <label className="full">
                Description en français *
                <textarea
                  value={descriptionFr}
                  disabled={readOnly}
                  onChange={(e) => setDescriptionFr(e.target.value)}
                />
              </label>
              <label>
                Durée (minutes)
                <input
                  type="number"
                  value={duration}
                  disabled={readOnly}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </label>
              <label>
                TVA (points de base)
                <input
                  type="number"
                  value={vatRateBps}
                  disabled={readOnly}
                  onChange={(e) => setVatRateBps(e.target.value)}
                />
              </label>
            </div>
          </section>
          <section className="card form-card">
            <div className="card-head">
              <h3>Traductions</h3>
              <span className="muted">Optionnel</span>
            </div>
            <div className="tabs">
              <button className={localeTab === "ar" ? "active" : ""} onClick={() => setLocaleTab("ar")}>
                Arabe
              </button>
              <button className={localeTab === "en" ? "active" : ""} onClick={() => setLocaleTab("en")}>
                Anglais
              </button>
            </div>
            {localeTab === "ar" ? (
              <>
                <label>
                  Nom en arabe
                  <input
                    dir="rtl"
                    placeholder="اسم القسيمة"
                    value={nameAr}
                    disabled={readOnly}
                    onChange={(e) => setNameAr(e.target.value)}
                  />
                </label>
                <label>
                  Description en arabe
                  <textarea
                    dir="rtl"
                    placeholder="وصف التجربة"
                    value={descriptionAr}
                    disabled={readOnly}
                    onChange={(e) => setDescriptionAr(e.target.value)}
                  />
                </label>
              </>
            ) : (
              <>
                <label>
                  Nom en anglais
                  <input
                    placeholder="Voucher name"
                    value={nameEn}
                    disabled={readOnly}
                    onChange={(e) => setNameEn(e.target.value)}
                  />
                </label>
                <label>
                  Description en anglais
                  <textarea
                    placeholder="Experience description"
                    value={descriptionEn}
                    disabled={readOnly}
                    onChange={(e) => setDescriptionEn(e.target.value)}
                  />
                </label>
              </>
            )}
          </section>
        </div>
        <aside className="stack">
          <section className="card form-card">
            <h3>Tarification</h3>
            <label>
              Prix public
              <input value={publicPrice} disabled={readOnly} onChange={(e) => setPublicPrice(e.target.value)} />
              <span className="input-unit">TND</span>
            </label>
            <label>
              Prix grossiste
              <input
                value={wholesalePrice}
                disabled={readOnly}
                onChange={(e) => setWholesalePrice(e.target.value)}
              />
              <span className="input-unit">TND</span>
            </label>
          </section>
          <section className="card form-card">
            <h3>Photo de couverture</h3>
            {photos.length > 0 && !photoPreview && (
              <div className="photo-list">
                {photos.map((photo, index) => (
                  <div className="photo-item" key={photo}>
                    {voucherId ? (
                      <VoucherPhotoThumb
                        voucherId={voucherId}
                        index={index}
                        photoKey={photo}
                        token={accessToken}
                      />
                    ) : (
                      <div className="photo-fallback">
                        <Icon name="ticket" />
                        <small>{photo.split("/").pop()}</small>
                      </div>
                    )}
                    {!readOnly && (
                      <button
                        type="button"
                        className="photo-remove"
                        disabled={busy}
                        onClick={() => removeExistingPhoto(photo)}
                      >
                        <Icon name="x" size={14} /> Supprimer
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {photoPreview && (
              <div className="photo-list">
                <div className="photo-item">
                  <img src={photoPreview} alt="Nouvelle photo" />
                  {!readOnly && (
                    <button type="button" className="photo-remove" disabled={busy} onClick={() => pickPhoto(null)}>
                      <Icon name="x" size={14} /> Annuler la sélection
                    </button>
                  )}
                </div>
              </div>
            )}
            {!photos.length && !photoPreview && readOnly && (
              <p className="muted">Aucune photo.</p>
            )}
            {!readOnly && (
              <>
                <label className="upload" style={{ cursor: "pointer" }}>
                  <Icon name="plus" />
                  <b>
                    {photoFile
                      ? photoFile.name
                      : photos.length
                        ? "Remplacer la photo"
                        : "Ajouter une photo"}
                  </b>
                  <span>JPG ou PNG · 5 Mo max.</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    hidden
                    onChange={(e) => pickPhoto(e.target.files?.[0] || null)}
                  />
                </label>
                {photos.length > 0 && photoFile && (
                  <p className="muted">
                    À l’enregistrement, les photos actuelles seront remplacées par le nouveau fichier.
                  </p>
                )}
              </>
            )}
          </section>
          {!readOnly && !isNew && (
            <button className="delete-link" disabled={busy} onClick={remove}>
              Supprimer ce type de bon
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}
