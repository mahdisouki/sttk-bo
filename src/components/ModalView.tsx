import { useUiStore, type Modal } from "../stores/uiStore";
import { Button } from "./Button";
import { Icon } from "./Icon";

export function ModalView({ type }: { type: Exclude<Modal, null> }) {
  const closeModal = useUiStore((s) => s.closeModal);
  const notify = useUiStore((s) => s.notify);
  const content = {
    cancel: {
      icon: "alert",
      title: "Annuler et rembourser",
      desc: "Cette action annulera la commande MV-2603-0182 et invalidera tous les bons non utilisés.",
      body: (
        <>
          <div className="error-note">
            <Icon name="alert" />
            <span>1 bon a déjà été utilisé. L’annulation est bloquée jusqu’à sa vérification.</span>
          </div>
          <label>
            Motif de l’annulation *
            <select defaultValue="">
              <option value="" disabled>
                Sélectionner un motif
              </option>
              <option>Demande du client</option>
            </select>
          </label>
          <label>
            Montant à rembourser *<input defaultValue="500,000" />
            <span className="input-unit">TND</span>
          </label>
        </>
      ),
      action: "Confirmer l’annulation",
      danger: true,
    },
    approve: {
      icon: "check",
      title: "Approuver le partenaire",
      desc: "Définissez les conditions de crédit initiales de Cap Bon Voyages.",
      body: (
        <>
          <label>
            Limite de crédit *<input defaultValue="20 000,000" />
            <span className="input-unit">TND</span>
          </label>
          <label>
            Délai de paiement *<input type="number" defaultValue="30" />
            <span className="input-unit">jours</span>
          </label>
          <label>
            Grille tarifaire
            <select>
              <option>Grille Agences 2026</option>
            </select>
          </label>
        </>
      ),
      action: "Approuver le partenaire",
      danger: false,
    },
    publish: {
      icon: "ticket",
      title: "Publier ce type de bon ?",
      desc: "Pass découverte Korbous sera immédiatement disponible pour les commandes B2C et B2B.",
      body: (
        <div className="success-note">
          <Icon name="check" />
          <span>Le nom français, les prix et la TVA sont correctement renseignés.</span>
        </div>
      ),
      action: "Publier maintenant",
      danger: false,
    },
    payment: {
      icon: "card",
      title: "Enregistrer un paiement agence",
      desc: "Le montant doit correspondre au total restant de la commande.",
      body: (
        <>
          <label>
            Mode de paiement
            <select>
              <option>Carte au bureau</option>
              <option>Espèces</option>
            </select>
          </label>
          <label>
            Montant reçu
            <input defaultValue="625,000" />
            <span className="input-unit">TND</span>
          </label>
          <label>
            Référence interne
            <input placeholder="Optionnel" />
          </label>
        </>
      ),
      action: "Enregistrer le paiement",
      danger: false,
    },
    offline: {
      icon: "cloud",
      title: "Confirmer 3 utilisations hors-ligne",
      desc: "Cette action marquera définitivement les trois bons comme utilisés à la date du jour.",
      body: (
        <div className="id-preview">
          <code>VCH-KRB-26-A8F2K</code>
          <code>VCH-KRB-26-B7M4P</code>
          <code>VCH-KRB-26-X2N8Q</code>
        </div>
      ),
      action: "Marquer comme utilisés",
      danger: false,
    },
  }[type];
  return (
    <div className="modal-backdrop" onMouseDown={closeModal}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-top">
          <span className={content.danger ? "danger-icon" : ""}>
            <Icon name={content.icon} />
          </span>
          <button onClick={closeModal}>
            <Icon name="x" />
          </button>
        </div>
        <h2>{content.title}</h2>
        <p>{content.desc}</p>
        <div className="modal-body">{content.body}</div>
        <div className="modal-actions">
          <Button variant="secondary" onClick={closeModal}>
            Annuler
          </Button>
          <Button
            variant={content.danger ? "danger" : "primary"}
            onClick={() => {
              closeModal();
              notify(
                type === "approve"
                  ? "Partenaire approuvé"
                  : type === "publish"
                    ? "Bon publié avec succès"
                    : "Action enregistrée",
              );
            }}
          >
            {content.action}
          </Button>
        </div>
      </div>
    </div>
  );
}
