export default class PdfService {
  async generateCertificate(cpf, name, templateHTML) {
    const isProduction = import.meta.env.VITE_ENV === "production";
    const baseUrl = isProduction
      ? import.meta.env.VITE_BASE_URL_PRODUCTION
      : import.meta.env.VITE_BASE_URL_SANDBOX;
    try {
      console.log("Gerando certificado PDF para:", { cpf, name, templateHTML });

      const response = await fetch(`${baseUrl}/certificate/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cpf, name, templateHTML }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao chamar o backend: ${response.statusText}`);
      }

      const pdfBlob = await response.blob();
      const url = URL.createObjectURL(pdfBlob);
      const fileName = `certificado_${cpf}_${name.replace(/\s/g, "_")}.pdf`;

      // console.log("Certificado gerado:", { url, fileName });
      return { url, name: fileName };
    } catch (error) {
      console.error("Erro ao gerar certificado PDF:", error);
      throw new Error("Erro ao gerar o certificado.");
    }
  }

  downloadCertificate(pdfData) {
    try {
      if (!pdfData.url || !pdfData.name) {
        throw new Error("Dados do PDF inválidos.");
      }

      const link = document.createElement("a");
      link.href = pdfData.url;
      link.download = pdfData.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // console.log("Download iniciado:", pdfData.name);
    } catch (error) {
      console.error("Erro ao baixar certificado:", error);
      throw new Error("Erro ao baixar o certificado.");
    }
  }
}
