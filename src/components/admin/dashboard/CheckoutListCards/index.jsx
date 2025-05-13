import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  Drawer,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import CheckoutCard from "../CheckoutCard";
import Filters from "../Filters";
import { useDashboard } from "../../../../data/contexts/DashboardContext";

const formatBrazilianCurrency = (value) => {
  if (isNaN(value)) return "R$ 0,00";
  return `R$ ${value
    .toFixed(2)
    .replace(".", ",")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
};

const formatBrazilianDate = (isoString, includeTime = false) => {
  if (!isoString) return "N/A";
  const date = new Date(isoString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  if (includeTime) {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }
  return `${day}/${month}/${year}`;
};

const calculateFee = (
  totalAmount,
  paymentMethod,
  cardBrand = "unknown",
  numParticipants = 1
) => {
  let totalFee = 0;
  cardBrand = cardBrand.toLowerCase();

  console.log(
    `Calculando taxa: totalAmount=${totalAmount}, paymentMethod=${paymentMethod}, cardBrand=${cardBrand}, numParticipants=${numParticipants}`
  );

  switch (paymentMethod) {
    case "pix":
      totalFee = totalAmount * 0.0099;
      break;
    case "creditCard":
    case "debitCard":
      if (["visa", "mastercard", "master"].includes(cardBrand)) {
        totalFee = totalAmount * 0.0449;
      } else if (cardBrand === "elo") {
        totalFee = totalAmount * 0.0509;
      } else {
        totalFee = totalAmount * 0.0449;
      }
      break;
    case "boleto":
      totalFee = 5.0;
      break;
    case "courtesy":
      totalFee = 0;
      break;
    default:
      totalFee = 0;
      console.warn(`Método de pagamento desconhecido: ${paymentMethod}`);
  }

  const feePerParticipant =
    numParticipants > 0 ? totalFee / numParticipants : 0;
  console.log(
    `Taxa total=${totalFee}, Taxa por participante=${feePerParticipant}`
  );
  return feePerParticipant;
};

const calculateParticipantValue = (checkout, participantIndex) => {
  const { orderDetails, coupon, paymentMethod } = checkout;
  if (paymentMethod === "courtesy") return 0;
  const { fullTickets, halfTickets } = orderDetails || {};
  const isGroupCoupon = coupon === "grupo" && fullTickets + halfTickets >= 5;

  let value;
  if (participantIndex < fullTickets) {
    value = 499;
    if (isGroupCoupon) {
      value -= 50;
    }
  } else {
    value = 399;
  }
  return value;
};

const CheckoutListCards = ({
  isMobile,
  setOpenFiltersDrawer,
  openFiltersDrawer,
}) => {
  const { filteredCheckouts: allFilteredCheckouts, filteredMetrics } =
    useDashboard();
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(6);
  const [paginatedCheckouts, setPaginatedCheckouts] = useState([]);
  const [viewMode, setViewMode] = useState(
    localStorage.getItem("checkoutViewMode") || "cards"
  );

  const handleToggleViewMode = () => {
    const newMode = viewMode === "cards" ? "table" : "cards";
    setViewMode(newMode);
    localStorage.setItem("checkoutViewMode", newMode);
  };

  const prepareTableData = (checkouts) => {
    const participantData = [];
    checkouts.forEach((checkout) => {
      const { paymentMethod, timestamp, participants, orderDetails } = checkout;
      const isCourtesy = paymentMethod === "courtesy";
      const totalAmount = isCourtesy
        ? 0
        : parseFloat(checkout.totalAmount) || 0;
      const cardBrand = checkout.paymentDetails?.creditCard?.brand || "unknown";
      const numParticipants = participants?.length || 1;

      console.log(
        `Processando checkout: id=${
          checkout.id
        }, paymentMethod=${paymentMethod}, courtesyTickets=${
          orderDetails?.courtesyTickets || 0
        }, numParticipants=${numParticipants}`
      );

      participants?.forEach((participant, index) => {
        const participantValue = calculateParticipantValue(checkout, index);
        const fee = isCourtesy
          ? 0
          : calculateFee(
              totalAmount,
              paymentMethod,
              cardBrand,
              numParticipants
            );
        const netAmount = participantValue - fee;

        participantData.push([
          participant.name || "N/A",
          participant.document || participant.cpf || "N/A",
          participant.email || "N/A",
          participant.number || "N/A", // Adiciona número de telefone
          formatBrazilianDate(timestamp, true),
          paymentMethod,
          formatBrazilianCurrency(participantValue),
          formatBrazilianCurrency(fee),
          formatBrazilianCurrency(netAmount),
        ]);
      });
    });
    return participantData;
  };

  const exportToExcel = () => {
    if (!allFilteredCheckouts) {
      console.error("allFilteredCheckouts não está definido");
      alert("Erro: Dados de checkouts não disponíveis. Tente novamente.");
      return;
    }

    const validCheckouts = (allFilteredCheckouts || []).filter(
      (checkout) =>
        checkout &&
        checkout.id &&
        Array.isArray(checkout.participants) &&
        checkout.timestamp &&
        checkout.orderDetails
    );

    const approvedCheckouts = validCheckouts.filter(
      (c) => c.status === "approved"
    );
    const pendingCheckouts = validCheckouts.filter(
      (c) => c.status === "pending"
    );
    const errorCheckouts = validCheckouts.filter((c) => c.status === "error");

    const sortByDate = (a, b) => new Date(b.timestamp) - new Date(a.timestamp);
    const sortedApproved = [...approvedCheckouts].sort(sortByDate);
    const sortedPending = [...pendingCheckouts].sort(sortByDate);
    const sortedErrors = [...errorCheckouts].sort(sortByDate);

    const approvedData = prepareTableData(sortedApproved).map((row) => ({
      "Nome do Participante": row[0],
      CPF: row[1],
      Email: row[2],
      Telefone: row[3], // Adiciona telefone
      "Data da Compra": row[4],
      Método: row[5],
      "Valor Bruto": row[6],
      Taxa: row[7],
      "Valor Líquido": row[8],
    }));
    const pendingData = prepareTableData(sortedPending).map((row) => ({
      "Nome do Participante": row[0],
      CPF: row[1],
      Email: row[2],
      Telefone: row[3], // Adiciona telefone
      "Data da Compra": row[4],
      Método: row[5],
      "Valor Bruto": row[6],
      Taxa: row[7],
      "Valor Líquido": row[8],
    }));
    const errorData = prepareTableData(sortedErrors).map((row) => ({
      "Nome do Participante": row[0],
      CPF: row[1],
      Email: row[2],
      Telefone: row[3], // Adiciona telefone
      "Data da Compra": row[4],
      Método: row[5],
      "Valor Bruto": row[6],
      Taxa: row[7],
      "Valor Líquido": row[8],
    }));

    const totalGross = sortedApproved.reduce((sum, checkout) => {
      const total =
        checkout.paymentMethod === "courtesy"
          ? 0
          : parseFloat(checkout.totalAmount) || 0;
      return sum + total;
    }, 0);
    const totalFees = sortedApproved.reduce((sum, checkout) => {
      const total =
        checkout.paymentMethod === "courtesy"
          ? 0
          : parseFloat(checkout.totalAmount) || 0;
      const numParticipants = checkout.participants?.length || 1;
      const fee =
        calculateFee(
          total,
          checkout.paymentMethod,
          checkout.paymentDetails?.creditCard?.brand,
          numParticipants
        ) * numParticipants;
      return sum + fee;
    }, 0);
    const totalNet = totalGross - totalFees;

    const totalFullTickets = sortedApproved.reduce(
      (sum, checkout) =>
        sum + (parseInt(checkout.orderDetails?.fullTickets) || 0),
      0
    );
    const totalHalfTickets = sortedApproved.reduce(
      (sum, checkout) =>
        sum + (parseInt(checkout.orderDetails?.halfTickets) || 0),
      0
    );
    const totalCourtesyTickets = sortedApproved.reduce((sum, checkout) => {
      const courtesyCount =
        parseInt(checkout.orderDetails?.courtesyTickets) ||
        (checkout.paymentMethod === "courtesy"
          ? checkout.participants.length
          : 0);
      console.log(
        `Checkout ${checkout.id}: courtesyTickets=${courtesyCount}, paymentMethod=${checkout.paymentMethod}`
      );
      return sum + courtesyCount;
    }, 0);

    const approvedWithTotals = [
      ...approvedData,
      {},
      {
        "Nome do Participante": "Total Bruto (Aprovados)",
        CPF: "",
        Email: "",
        Telefone: "", // Adiciona telefone
        "Data da Compra": "",
        Método: "",
        "Valor Bruto": formatBrazilianCurrency(totalGross),
        Taxa: formatBrazilianCurrency(totalFees),
        "Valor Líquido": formatBrazilianCurrency(totalNet),
      },
      {
        "Nome do Participante": "Ingressos Inteiros",
        CPF: "",
        Email: "",
        Telefone: "", // Adiciona telefone
        "Data da Compra": "",
        Método: "",
        "Valor Bruto": totalFullTickets.toString(),
        Taxa: "",
        "Valor Líquido": "",
      },
      {
        "Nome do Participante": "Ingressos Meia",
        CPF: "",
        Email: "",
        Telefone: "", // Adiciona telefone
        "Data da Compra": "",
        Método: "",
        "Valor Bruto": totalHalfTickets.toString(),
        Taxa: "",
        "Valor Líquido": "",
      },
      {
        "Nome do Participante": "Ingressos Cortesias",
        CPF: "",
        Email: "",
        Telefone: "", // Adiciona telefone
        "Data da Compra": "",
        Método: "",
        "Valor Bruto": totalCourtesyTickets.toString(),
        Taxa: "",
        "Valor Líquido": "",
      },
    ];

    const wb = XLSX.utils.book_new();

    // Função auxiliar para aplicar estilos à planilha
    const styleWorksheet = (ws, dataLength) => {
      const range = XLSX.utils.decode_range(ws["!ref"]);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = { c: C, r: R };
          const cellRef = XLSX.utils.encode_cell(cellAddress);
          if (!ws[cellRef]) continue;

          ws[cellRef].s = {
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } },
            },
            alignment: {
              vertical: "center",
              horizontal: C >= 6 ? "right" : "left",
            },
          };

          if (R === 0) {
            ws[cellRef].s = {
              ...ws[cellRef].s,
              font: { bold: true, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "16A085" } },
            };
          } else if (R <= dataLength) {
            ws[cellRef].s = {
              ...ws[cellRef].s,
              fill: { fgColor: { rgb: R % 2 === 1 ? "F5F5F5" : "FFFFFF" } },
            };
          } else {
            ws[cellRef].s = {
              ...ws[cellRef].s,
              font: { bold: true },
              fill: { fgColor: { rgb: "E0F7FA" } },
            };
          }
        }
      }
      ws["!cols"] = [
        { wch: 30 }, // Nome
        { wch: 15 }, // CPF
        { wch: 25 }, // Email
        { wch: 15 }, // Telefone
        { wch: 20 }, // Data
        { wch: 12 }, // Método
        { wch: 15 }, // Valor Bruto
        { wch: 15 }, // Taxa
        { wch: 15 }, // Valor Líquido
      ];
    };

    const wsApproved = XLSX.utils.json_to_sheet(approvedWithTotals);
    styleWorksheet(wsApproved, approvedData.length);
    const wsPending = XLSX.utils.json_to_sheet(pendingData);
    styleWorksheet(wsPending, pendingData.length);
    const wsErrors = XLSX.utils.json_to_sheet(errorData);
    styleWorksheet(wsErrors, errorData.length);

    XLSX.utils.book_append_sheet(wb, wsApproved, "Aprovados");
    if (pendingData.length > 0) {
      XLSX.utils.book_append_sheet(wb, wsPending, "Pendentes");
    }
    if (errorData.length > 0) {
      XLSX.utils.book_append_sheet(wb, wsErrors, "Erros");
    }

    XLSX.writeFile(wb, "relatorio_participantes_completo.xlsx");
  };

  const exportToPDF = () => {
    if (!allFilteredCheckouts) {
      console.error("allFilteredCheckouts não está definido");
      alert("Erro: Dados de checkouts não disponíveis. Tente novamente.");
      return;
    }

    const doc = new jsPDF();
    const currentDate = formatBrazilianDate(new Date());
    doc.setFontSize(16);
    doc.text(
      `Relatório de Participantes até dia ${currentDate} - Congresso Autismo MA`,
      10,
      10
    );

    const validCheckouts = (allFilteredCheckouts || []).filter(
      (checkout) =>
        checkout &&
        checkout.id &&
        Array.isArray(checkout.participants) &&
        checkout.timestamp &&
        checkout.orderDetails
    );

    const approvedCheckouts = validCheckouts.filter(
      (c) => c.status === "approved"
    );
    const pendingCheckouts = validCheckouts.filter(
      (c) => c.status === "pending"
    );
    const errorCheckouts = validCheckouts.filter((c) => c.status === "error");

    const sortByDate = (a, b) => new Date(b.timestamp) - new Date(a.timestamp);
    const sortedApproved = [...approvedCheckouts].sort(sortByDate);
    const sortedPending = [...pendingCheckouts].sort(sortByDate);
    const sortedErrors = [...errorCheckouts].sort(sortByDate);

    const totalGross = sortedApproved.reduce((sum, checkout) => {
      const total =
        checkout.paymentMethod === "courtesy"
          ? 0
          : parseFloat(checkout.totalAmount) || 0;
      return sum + total;
    }, 0);
    const totalFees = sortedApproved.reduce((sum, checkout) => {
      const total =
        checkout.paymentMethod === "courtesy"
          ? 0
          : parseFloat(checkout.totalAmount) || 0;
      const numParticipants = checkout.participants?.length || 1;
      const fee =
        calculateFee(
          total,
          checkout.paymentMethod,
          checkout.paymentDetails?.creditCard?.brand,
          numParticipants
        ) * numParticipants;
      return sum + fee;
    }, 0);
    const totalNet = totalGross - totalFees;

    const totalFullTickets = sortedApproved.reduce(
      (sum, checkout) =>
        sum + (parseInt(checkout.orderDetails?.fullTickets) || 0),
      0
    );
    const totalHalfTickets = sortedApproved.reduce(
      (sum, checkout) =>
        sum + (parseInt(checkout.orderDetails?.halfTickets) || 0),
      0
    );
    const totalCourtesyTickets = sortedApproved.reduce((sum, checkout) => {
      const courtesyCount =
        parseInt(checkout.orderDetails?.courtesyTickets) ||
        (checkout.paymentMethod === "courtesy"
          ? checkout.participants.length
          : 0);
      console.log(
        `Checkout ${checkout.id}: courtesyTickets=${courtesyCount}, paymentMethod=${checkout.paymentMethod}`
      );
      return sum + courtesyCount;
    }, 0);

    doc.setFontSize(12);
    doc.text("Totais (Aprovados)", 10, 20);
    autoTable(doc, {
      startY: 25,
      head: [["Descrição", "Valor"]],
      body: [
        ["Total Bruto", formatBrazilianCurrency(totalGross)],
        ["Total Taxas", formatBrazilianCurrency(totalFees)],
        ["Total Líquido", formatBrazilianCurrency(totalNet)],
        ["Ingressos Inteiros", totalFullTickets.toString()],
        ["Ingressos Meia", totalHalfTickets.toString()],
        ["Ingressos Cortesias", totalCourtesyTickets.toString()],
      ],
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [22, 160, 133], textColor: [255, 255, 255] },
      columnStyles: { 1: { halign: "right" } },
      margin: { left: 10, right: 10 },
    });

    let finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text("Participantes Aprovados", 10, finalY);
    const approvedTableData = prepareTableData(sortedApproved);

    autoTable(doc, {
      startY: finalY + 5,
      head: [
        [
          "Nome do Participante",
          "CPF",
          "Email",
          "Telefone",
          "Data da Compra",
          "Método",
          "Valor Bruto",
          "Taxa",
          "Valor Líquido",
        ],
      ],
      body: approvedTableData,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [22, 160, 133], textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 35 }, // Nome
        1: { cellWidth: 20 }, // CPF
        2: { cellWidth: 30 }, // Email
        3: { cellWidth: 20 }, // Telefone
        4: { cellWidth: 25 }, // Data
        5: { cellWidth: 15 }, // Método
        6: { halign: "right", cellWidth: 15 }, // Valor Bruto
        7: { halign: "right", cellWidth: 15 }, // Taxa
        8: { halign: "right", cellWidth: 15 }, // Valor Líquido
      },
    });

    finalY = doc.lastAutoTable.finalY + 10;
    const pageHeight = doc.internal.pageSize.height;
    if (sortedPending.length > 0) {
      if (finalY + 20 > pageHeight - 10) {
        doc.addPage();
        finalY = 20;
      }
      doc.setFontSize(12);
      doc.text("Participantes Pendentes", 10, finalY);
      const pendingTableData = prepareTableData(sortedPending);

      autoTable(doc, {
        startY: finalY + 5,
        head: [
          [
            "Nome do Participante",
            "CPF",
            "Email",
            "Telefone",
            "Data da Compra",
            "Método",
            "Valor Bruto",
            "Taxa",
            "Valor Líquido",
          ],
        ],
        body: pendingTableData,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [255, 179, 0], textColor: [255, 255, 255] },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 20 },
          2: { cellWidth: 30 },
          3: { cellWidth: 20 },
          4: { cellWidth: 25 },
          5: { cellWidth: 15 },
          6: { halign: "right", cellWidth: 15 },
          7: { halign: "right", cellWidth: 15 },
          8: { halign: "right", cellWidth: 15 },
        },
      });
      finalY = doc.lastAutoTable.finalY;
    }

    if (sortedErrors.length > 0) {
      finalY += 10;
      if (finalY + 20 > pageHeight - 10) {
        doc.addPage();
        finalY = 20;
      }
      doc.setFontSize(12);
      doc.text("Participantes com Erro", 10, finalY);
      const errorTableData = prepareTableData(sortedErrors);

      autoTable(doc, {
        startY: finalY + 5,
        head: [
          [
            "Nome do Participante",
            "CPF",
            "Email",
            "Telefone",
            "Data da Compra",
            "Método",
            "Valor Bruto",
            "Taxa",
            "Valor Líquido",
          ],
        ],
        body: errorTableData,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [211, 47, 47], textColor: [255, 255, 255] },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 20 },
          2: { cellWidth: 30 },
          3: { cellWidth: 20 },
          4: { cellWidth: 25 },
          5: { cellWidth: 15 },
          6: { halign: "right", cellWidth: 15 },
          7: { halign: "right", cellWidth: 15 },
          8: { halign: "right", cellWidth: 15 },
        },
      });
    }

    doc.save("relatorio_participantes_completo.pdf");
  };

  useEffect(() => {
    if (!allFilteredCheckouts) {
      console.warn("allFilteredCheckouts está indefinido no useEffect");
      setPaginatedCheckouts([]);
      return;
    }

    const validCheckouts = (allFilteredCheckouts || []).filter(
      (checkout) =>
        checkout &&
        checkout.id &&
        Array.isArray(checkout.participants) &&
        checkout.timestamp &&
        checkout.orderDetails
    );

    const sortedCheckouts = [...validCheckouts].sort((a, b) => {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const newPaginatedCheckouts = sortedCheckouts.slice(startIndex, endIndex);
    setPaginatedCheckouts(newPaginatedCheckouts);
  }, [page, allFilteredCheckouts, rowsPerPage]);

  const handleChangePage = (newPage) => {
    setPage(newPage);
  };

  const validCheckoutsCount = (allFilteredCheckouts || []).filter(
    (checkout) =>
      checkout &&
      checkout.id &&
      Array.isArray(checkout.participants) &&
      checkout.timestamp &&
      checkout.orderDetails
  ).length;
  const totalPages = Math.ceil(validCheckoutsCount / rowsPerPage);

  return (
    <Card
      sx={{
        backgroundColor: "#FFFFFF",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      }}
    >
      <CardContent sx={{ p: "20px" }}>
        <Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              mb: 2,
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <Typography
                variant="h6"
                sx={{ color: "#333333", fontWeight: 500 }}
              >
                {validCheckoutsCount} - Checkouts
                <Box
                  sx={{
                    width: "100%",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      flex: "1 1 30%",
                      color: "#666666",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: isMobile ? "flex-start" : "center",
                      gap: isMobile ? 0 : 2,
                      flexDirection: isMobile ? "column" : "row",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 500, fontSize: ".80rem" }}
                    >
                      Aprovados: {filteredMetrics?.approvedCount || 0} -{" "}
                      {filteredMetrics?.approvedValue || 0}
                    </Typography>
                    {!isMobile && <Typography>|</Typography>}
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 500, fontSize: ".80rem" }}
                    >
                      Pendentes: {filteredMetrics?.pendingCount || 0} -{" "}
                      {filteredMetrics?.pendingValue || 0}
                    </Typography>
                    {!isMobile && <Typography>|</Typography>}
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 500, fontSize: ".80rem" }}
                    >
                      Erros: {filteredMetrics?.errorCount || 0}
                    </Typography>
                  </Box>
                </Box>
              </Typography>
              {isMobile && (
                <>
                  <Button
                    variant="outlined"
                    onClick={() => setOpenFiltersDrawer(true)}
                    sx={{
                      borderColor: "#1976D2",
                      color: "#1976D2",
                      borderRadius: "8px",
                      textTransform: "none",
                    }}
                  >
                    Filtros
                  </Button>
                  <Drawer
                    anchor="left"
                    open={openFiltersDrawer}
                    onClose={() => setOpenFiltersDrawer(false)}
                    sx={{
                      "& .MuiDrawer-paper": {
                        width: "80%",
                        maxWidth: 300,
                        backgroundColor: "#FFFFFF",
                      },
                    }}
                  >
                    <Filters
                      isMobile={isMobile}
                      setOpenFiltersDrawer={setOpenFiltersDrawer}
                    />
                  </Drawer>
                </>
              )}
            </Box>
            <Box
              sx={{
                display: "flex",
                gap: 1,
                flexWrap: "wrap",
                mb: 1,
              }}
            >
              <Button
                variant="outlined"
                onClick={exportToExcel}
                sx={{
                  borderColor: "#1976D2",
                  color: "#1976D2",
                  borderRadius: "8px",
                  textTransform: "none",
                  "&:hover": { borderColor: "#1565C0", color: "#1565C0" },
                }}
              >
                Exportar Excel
              </Button>
              <Button
                variant="outlined"
                onClick={exportToPDF}
                sx={{
                  borderColor: "#1976D2",
                  color: "#1976D2",
                  borderRadius: "8px",
                  textTransform: "none",
                  "&:hover": { borderColor: "#1565C0", color: "#1565C0" },
                }}
              >
                Exportar PDF
              </Button>
              <Button
                variant="contained"
                onClick={handleToggleViewMode}
                sx={{
                  borderColor: "#1976D2",
                  color: "#FFF",
                  borderRadius: "8px",
                  textTransform: "none",
                }}
              >
                {viewMode === "cards" ? "Ver como Tabela" : "Ver como Cards"}
              </Button>
            </Box>
          </Box>

          {viewMode === "cards" ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              {paginatedCheckouts.map((checkout) => (
                <Box
                  sx={{ flex: "1 1 29%", minWidth: "250px" }}
                  key={checkout.id}
                >
                  <CheckoutCard checkout={checkout} isMobile={isMobile} />
                </Box>
              ))}
            </Box>
          ) : (
            <TableContainer
              component={Paper}
              sx={{ maxHeight: 400, overflowX: "auto" }}
            >
              <Table stickyHeader sx={{ minWidth: isMobile ? 700 : "auto" }}>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{ backgroundColor: "#F5F5F5", fontWeight: "bold" }}
                    >
                      Nome do Participante
                    </TableCell>
                    <TableCell
                      sx={{ backgroundColor: "#F5F5F5", fontWeight: "bold" }}
                    >
                      CPF
                    </TableCell>
                    <TableCell
                      sx={{ backgroundColor: "#F5F5F5", fontWeight: "bold" }}
                    >
                      Email
                    </TableCell>
                    <TableCell
                      sx={{ backgroundColor: "#F5F5F5", fontWeight: "bold" }}
                    >
                      Telefone
                    </TableCell>
                    <TableCell
                      sx={{ backgroundColor: "#F5F5F5", fontWeight: "bold" }}
                    >
                      Data e Hora
                    </TableCell>
                    <TableCell
                      sx={{ backgroundColor: "#F5F5F5", fontWeight: "bold" }}
                    >
                      Método
                    </TableCell>
                    <TableCell
                      sx={{
                        backgroundColor: "#F5F5F5",
                        fontWeight: "bold",
                        textAlign: "right",
                      }}
                    >
                      Valor Bruto
                    </TableCell>
                    <TableCell
                      sx={{
                        backgroundColor: "#F5F5F5",
                        fontWeight: "bold",
                        textAlign: "right",
                      }}
                    >
                      Taxa
                    </TableCell>
                    <TableCell
                      sx={{
                        backgroundColor: "#F5F5F5",
                        fontWeight: "bold",
                        textAlign: "right",
                      }}
                    >
                      Valor Líquido
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedCheckouts.map((checkout) => {
                    const totalAmount =
                      checkout.paymentMethod === "courtesy"
                        ? 0
                        : parseFloat(checkout.totalAmount) || 0;
                    const paymentMethod = checkout.paymentMethod || "unknown";
                    const cardBrand =
                      checkout.paymentDetails?.creditCard?.brand || "unknown";
                    const numParticipants = checkout.participants?.length || 1;
                    return checkout.participants.map((participant, index) => {
                      const participantValue = calculateParticipantValue(
                        checkout,
                        index
                      );
                      const fee = calculateFee(
                        totalAmount,
                        paymentMethod,
                        cardBrand,
                        numParticipants
                      );
                      const netAmount = participantValue - fee;
                      return (
                        <TableRow key={`${checkout.id}-${index}`}>
                          <TableCell>{participant.name || "N/A"}</TableCell>
                          <TableCell>{participant.document || "N/A"}</TableCell>
                          <TableCell>{participant.email || "N/A"}</TableCell>
                          <TableCell>{participant.phone || "N/A"}</TableCell>
                          <TableCell>
                            {formatBrazilianDate(checkout.timestamp, true)}
                          </TableCell>
                          <TableCell>{paymentMethod}</TableCell>
                          <TableCell sx={{ textAlign: "right" }}>
                            {formatBrazilianCurrency(participantValue)}
                          </TableCell>
                          <TableCell sx={{ textAlign: "right" }}>
                            {formatBrazilianCurrency(fee)}
                          </TableCell>
                          <TableCell sx={{ textAlign: "right" }}>
                            {formatBrazilianCurrency(netAmount)}
                          </TableCell>
                        </TableRow>
                      );
                    });
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <Button
              disabled={page === 0}
              onClick={() => handleChangePage(page - 1)}
              sx={{
                color: "#1976D2",
                "&:hover": { color: "#1565C0" },
                "&:disabled": { color: "#B0BEC5" },
              }}
            >
              Anterior
            </Button>
            <Typography
              sx={{
                mx: 2,
                color: "#333333",
                display: "flex",
                alignItems: "center",
              }}
            >
              Página {page + 1} de {totalPages}
            </Typography>
            <Button
              disabled={page + 1 >= totalPages}
              onClick={() => handleChangePage(page + 1)}
              sx={{
                color: "#1976D2",
                "&:hover": { color: "#1565C0" },
                "&:disabled": { color: "#B0BEC5" },
              }}
            >
              Próxima
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CheckoutListCards;
