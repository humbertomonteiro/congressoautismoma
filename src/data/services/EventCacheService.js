/**
 * EventCacheService
 *
 * Carrega o snapshot JSON exportado pelo script `exportEventData.js` do backend.
 * O arquivo fica em /public/data/<slug>_latest.json e é servido como asset estático,
 * sem nenhuma leitura no Firestore.
 *
 * Uso:
 *   const cache = await EventCacheService.load("Congresso Autismo MA 2025");
 *   const { checkouts, totalParticipants } = cache;
 */

const slugify = (str) =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/(^_|_$)/g, "");

/** Cache em memória para evitar múltiplos fetches na mesma sessão */
const _memoryCache = {};

const EventCacheService = {
  /**
   * Carrega o snapshot de um evento a partir do arquivo JSON estático.
   * Retorna null se o arquivo não existir (evento ainda não exportado).
   *
   * @param {string} eventName  Ex: "Congresso Autismo MA 2025"
   * @returns {Promise<{exportedAt, eventName, totalCheckouts, totalParticipants, checkouts} | null>}
   */
  async load(eventName) {
    if (_memoryCache[eventName]) return _memoryCache[eventName];

    const slug = slugify(eventName);
    const url = `/data/${slug}_latest.json`;

    try {
      const res = await fetch(url);
      if (!res.ok) return null; // arquivo não existe — evento não exportado ainda

      const data = await res.json();
      _memoryCache[eventName] = data;
      return data;
    } catch {
      return null;
    }
  },

  /**
   * Retorna todos os checkouts aprovados de um evento (a partir do cache).
   * Retorna null se o cache não estiver disponível.
   */
  async getApprovedCheckouts(eventName) {
    const cache = await this.load(eventName);
    if (!cache) return null;
    return cache.checkouts.filter((c) => c.status === "approved");
  },

  /**
   * Busca um participante pelo CPF dentro do cache do evento.
   * Retorna { participant, checkoutId, checkoutData } ou null.
   */
  async findParticipantByCpf(eventName, cleanCpf) {
    const checkouts = await this.getApprovedCheckouts(eventName);
    if (!checkouts) return null;

    for (const checkout of checkouts) {
      const participant = (checkout.participants || []).find((p) => {
        const cpf = (p.cpf || p.document || "").replace(/\D/g, "");
        return cpf === cleanCpf;
      });
      if (participant) {
        return { participant, checkoutId: checkout.id, checkoutData: checkout };
      }
    }
    return null;
  },

  /**
   * Busca um participante pelo e-mail dentro do cache do evento.
   */
  async findParticipantByEmail(eventName, cleanEmail) {
    const checkouts = await this.getApprovedCheckouts(eventName);
    if (!checkouts) return null;

    for (const checkout of checkouts) {
      const participant = (checkout.participants || []).find(
        (p) => (p.email || "").toLowerCase().trim() === cleanEmail
      );
      if (participant) {
        return { participant, checkoutId: checkout.id, checkoutData: checkout };
      }
    }
    return null;
  },

  /**
   * Busca um participante pelo telefone dentro do cache do evento.
   */
  async findParticipantByPhone(eventName, cleanPhone) {
    const checkouts = await this.getApprovedCheckouts(eventName);
    if (!checkouts) return null;

    for (const checkout of checkouts) {
      const participant = (checkout.participants || []).find(
        (p) => (p.number || "").replace(/\D/g, "") === cleanPhone
      );
      if (participant) {
        return { participant, checkoutId: checkout.id, checkoutData: checkout };
      }
    }
    return null;
  },

  /** Limpa o cache em memória (força novo fetch na próxima chamada) */
  invalidate(eventName) {
    if (eventName) {
      delete _memoryCache[eventName];
    } else {
      Object.keys(_memoryCache).forEach((k) => delete _memoryCache[k]);
    }
  },
};

export default EventCacheService;
