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
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatBrazilianDate = (date, includeTime = false) => {
  const options = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: includeTime ? "2-digit" : undefined,
    minute: includeTime ? "2-digit" : undefined,
    timeZone: "America/Sao_Paulo",
  };
  return new Date(date).toLocaleString("pt-BR", options);
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
      totalFee = totalAmount * 0.0099; // 0.99%
      break;
    case "creditCard":
    case "debitCard":
      if (["visa", "mastercard", "master"].includes(cardBrand)) {
        totalFee = totalAmount * 0.0449; // 4.49%
      } else if (cardBrand === "elo") {
        totalFee = totalAmount * 0.0509; // 5.09%
      } else {
        totalFee = totalAmount * 0.0449; // Default Visa/Master
      }
      break;
    case "boleto":
      totalFee = 5.0; // R$ 5 per checkout
      break;
    case "courtesy":
      totalFee = 0; // No fee for courtesies
      break;
    default:
      totalFee = 0;
      console.warn(`Unknown payment method: ${paymentMethod}`);
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
  const isTherapistCoupon = coupon === "terapeuta";

  let value;
  if (participantIndex < fullTickets) {
    value = 499; // Full ticket
    if (isGroupCoupon || isTherapistCoupon) {
      value -= 50; // R$50 discount
    }
  } else {
    value = 399; // Half ticket
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

  const prepareTableData = (checkouts, forPDF = false) => {
    const tableData = [];
    checkouts.forEach((checkout) => {
      const { paymentMethod, timestamp, id, participants, orderDetails } =
        checkout;
      const isCourtesy = paymentMethod === "courtesy";
      const totalAmount = isCourtesy
        ? 0
        : parseFloat(checkout.totalAmount) || 0;
      const numParticipants = participants?.length || 1;
      const cardBrand = checkout.paymentDetails?.creditCard?.brand || "unknown";

      console.log(
        `Processando checkout: id=${id}, paymentMethod=${paymentMethod}, courtesyTickets=${
          orderDetails?.courtesyTickets || 0
        }, numParticipants=${numParticipants}`
      );

      participants.forEach((participant, index) => {
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
        const ticketType = isCourtesy
          ? "Cortesia"
          : index < orderDetails.fullTickets
          ? "Inteira"
          : "Meia";

        const row = forPDF
          ? [
              participant.name || "N/A",
              participant.document || participant.cpf || "N/A",
              participant.email || "N/A",
              formatBrazilianDate(timestamp, true),
              paymentMethod,
              formatBrazilianCurrency(participantValue),
              // formatBrazilianCurrency(fee),
              formatBrazilianCurrency(netAmount),
            ]
          : [
              id,
              participant.name || "N/A",
              participant.document || participant.cpf || "N/A",
              participant.email || "N/A",
              ticketType,
              formatBrazilianDate(timestamp, true),
              paymentMethod,
              formatBrazilianCurrency(participantValue),
              formatBrazilianCurrency(fee),
              formatBrazilianCurrency(netAmount),
            ];

        tableData.push(row);
      });
    });
    return tableData;
  };

  const exportToExcel = () => {
    if (!allFilteredCheckouts || !Array.isArray(allFilteredCheckouts)) {
      console.error(
        "allFilteredCheckouts is not an array:",
        allFilteredCheckouts
      );
      alert("Erro: Dados de checkouts não disponíveis. Tente novamente.");
      return;
    }

    const validCheckouts = allFilteredCheckouts.filter(
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

    const approvedData = prepareTableData(sortedApproved).map((row, index) => ({
      "ID do Checkout": row[0],
      "Nome do Participante": row[1],
      CPF: row[2],
      Email: row[3],
      "Tipo de Ingresso": row[4],
      "Data da Compra": row[5],
      Método: row[6],
      "Valor Pago": row[7],
      Taxa: row[8],
      "Valor Líquido": row[9],
      __style: { fillColor: index % 2 === 0 ? "#E6F4EA" : "#FFFFFF" }, // Verde claro alternado
    }));

    const pendingData = prepareTableData(sortedPending).map((row, index) => ({
      "ID do Checkout": row[0],
      "Nome do Participante": row[1],
      CPF: row[2],
      Email: row[3],
      "Tipo de Ingresso": row[4],
      "Data da Compra": row[5],
      Método: row[6],
      "Valor Pago": row[7],
      Taxa: row[8],
      "Valor Líquido": row[9],
      __style: { fillColor: index % 2 === 0 ? "#FFF4E6" : "#FFFFFF" }, // Amarelo claro alternado
    }));

    const errorData = prepareTableData(sortedErrors).map((row, index) => ({
      "ID do Checkout": row[0],
      "Nome do Participante": row[1],
      CPF: row[2],
      Email: row[3],
      "Tipo de Ingresso": row[4],
      "Data da Compra": row[5],
      Método: row[6],
      "Valor Pago": row[7],
      Taxa: row[8],
      "Valor Líquido": row[9],
      __style: { fillColor: index % 2 === 0 ? "#FFE6E6" : "#FFFFFF" }, // Vermelho claro alternado
    }));

    const totalGross = sortedApproved.reduce(
      (sum, checkout) =>
        sum +
        (checkout.paymentMethod === "courtesy"
          ? 0
          : parseFloat(checkout.totalAmount) || 0),
      0
    );
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
        "ID do Checkout": "",
        "Nome do Participante": "Total Bruto (Aprovados)",
        CPF: "",
        Email: "",
        "Tipo de Ingresso": "",
        "Data da Compra": "",
        Método: "",
        "Valor Pago": formatBrazilianCurrency(totalGross),
        Taxa: formatBrazilianCurrency(totalFees),
        "Valor Líquido": formatBrazilianCurrency(totalNet),
        __style: { fillColor: "#D3D3D3" }, // Cinza para totais
      },
      {
        "ID do Checkout": "",
        "Nome do Participante": "Ingressos Inteiros",
        CPF: "",
        Email: "",
        "Tipo de Ingresso": "",
        "Data da Compra": "",
        Método: "",
        "Valor Pago": totalFullTickets.toString(),
        Taxa: "",
        "Valor Líquido": "",
        __style: { fillColor: "#D3D3D3" },
      },
      {
        "ID do Checkout": "",
        "Nome do Participante": "Ingressos Meia",
        CPF: "",
        Email: "",
        "Tipo de Ingresso": "",
        "Data da Compra": "",
        Método: "",
        "Valor Pago": totalHalfTickets.toString(),
        Taxa: "",
        "Valor Líquido": "",
        __style: { fillColor: "#D3D3D3" },
      },
      {
        "ID do Checkout": "",
        "Nome do Participante": "Ingressos Cortesias",
        CPF: "",
        Email: "",
        "Tipo de Ingresso": "",
        "Data da Compra": "",
        Método: "",
        "Valor Pago": totalCourtesyTickets.toString(),
        Taxa: "",
        "Valor Líquido": "",
        __style: { fillColor: "#D3D3D3" },
      },
    ];

    const wb = XLSX.utils.book_new();

    // Função para ajustar largura das colunas
    const adjustColumnWidths = (data) => {
      const columnWidths = [];
      const headers = Object.keys(data[0]).filter((key) => key !== "__style");
      headers.forEach((header, colIndex) => {
        let maxLength = header.length;
        data.forEach((row) => {
          const value = row[header] ? row[header].toString() : "";
          maxLength = Math.max(maxLength, value.length);
        });
        columnWidths.push({ wch: Math.min(Math.max(maxLength + 2, 10), 50) });
      });
      return columnWidths;
    };

    // Aplicar estilos e larguras
    const wsApproved = XLSX.utils.json_to_sheet(approvedWithTotals, {
      skipHeader: false,
    });
    wsApproved["!cols"] = adjustColumnWidths(approvedWithTotals);
    Object.keys(wsApproved).forEach((cell) => {
      if (!cell.startsWith("!")) {
        const rowIndex = parseInt(cell.match(/\d+/)[0]) - 1;
        if (approvedWithTotals[rowIndex]?.__style) {
          wsApproved[cell].s = approvedWithTotals[rowIndex].__style;
        }
      }
    });

    const wsPending = XLSX.utils.json_to_sheet(pendingData);
    wsPending["!cols"] = adjustColumnWidths(pendingData);
    Object.keys(wsPending).forEach((cell) => {
      if (!cell.startsWith("!")) {
        const rowIndex = parseInt(cell.match(/\d+/)[0]) - 1;
        if (pendingData[rowIndex]?.__style) {
          wsPending[cell].s = pendingData[rowIndex].__style;
        }
      }
    });

    const wsErrors = XLSX.utils.json_to_sheet(errorData);
    wsErrors["!cols"] = adjustColumnWidths(errorData);
    Object.keys(wsErrors).forEach((cell) => {
      if (!cell.startsWith("!")) {
        const rowIndex = parseInt(cell.match(/\d+/)[0]) - 1;
        if (errorData[rowIndex]?.__style) {
          wsErrors[cell].s = errorData[rowIndex].__style;
        }
      }
    });

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
    if (!allFilteredCheckouts || !Array.isArray(allFilteredCheckouts)) {
      console.error(
        "allFilteredCheckouts is not an array:",
        allFilteredCheckouts
      );
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

    const validCheckouts = allFilteredCheckouts.filter(
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

    const totalGross = sortedApproved.reduce(
      (sum, checkout) =>
        sum +
        (checkout.paymentMethod === "courtesy"
          ? 0
          : parseFloat(checkout.totalAmount) || 0),
      0
    );
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
    const approvedTableData = prepareTableData(sortedApproved, true);

    autoTable(doc, {
      startY: finalY + 5,
      head: [
        [
          "Nome do Participante",
          "CPF",
          "Email",
          "Data da Compra",
          "Método",
          "Valor Pago",
          // "Taxa",
          "Valor Líquido",
        ],
      ],
      body: approvedTableData,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [22, 160, 133], textColor: [255, 255, 255] },
      columnStyles: {
        5: { halign: "right" },
        6: { halign: "right" },
        7: { halign: "right" },
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
      const pendingTableData = prepareTableData(sortedPending, true);

      autoTable(doc, {
        startY: finalY + 5,
        head: [
          [
            "Nome do Participante",
            "CPF",
            "Email",
            "Data da Compra",
            "Método",
            // "Valor Pago",
            // "Taxa",
            // "Valor Líquido",
          ],
        ],
        body: pendingTableData,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [255, 179, 0], textColor: [255, 255, 255] },
        columnStyles: {
          5: { halign: "right" },
          6: { halign: "right" },
          7: { halign: "right" },
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
      const errorTableData = prepareTableData(sortedErrors, true);

      autoTable(doc, {
        startY: finalY + 5,
        head: [
          [
            "Nome do Participante",
            "CPF",
            "Email",
            "Data da Compra",
            "Método",
            // "Valor Pago",
            // "Taxa",
            // "Valor Líquido",
          ],
        ],
        body: errorTableData,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [211, 47, 47], textColor: [255, 255, 255] },
        columnStyles: {
          5: { halign: "right" },
          6: { halign: "right" },
          7: { halign: "right" },
        },
      });
    }

    doc.save("relatorio_participantes_completo.pdf");
  };

  useEffect(() => {
    if (!allFilteredCheckouts || !Array.isArray(allFilteredCheckouts)) {
      console.warn(
        "allFilteredCheckouts is not an array:",
        allFilteredCheckouts
      );
      setPaginatedCheckouts([]);
      return;
    }

    const validCheckouts = allFilteredCheckouts.filter(
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

  const validCheckoutsCount = Array.isArray(allFilteredCheckouts)
    ? allFilteredCheckouts.filter(
        (checkout) =>
          checkout &&
          checkout.id &&
          Array.isArray(checkout.participants) &&
          checkout.timestamp &&
          checkout.orderDetails
      ).length
    : 0;
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
              <Table stickyHeader sx={{ minWidth: isMobile ? 600 : "auto" }}>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{ backgroundColor: "#F5F5F5", fontWeight: "bold" }}
                    >
                      ID do Checkout
                    </TableCell>
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
                      Tipo de Ingresso
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
                      Valor Pago
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
                      const ticketType =
                        checkout.paymentMethod === "courtesy"
                          ? "Cortesia"
                          : index < checkout.orderDetails.fullTickets
                          ? "Inteira"
                          : "Meia";
                      return (
                        <TableRow key={`${checkout.id}-${index}`}>
                          <TableCell>{checkout.id}</TableCell>
                          <TableCell>{participant.name || "N/A"}</TableCell>
                          <TableCell>
                            {participant.document || participant.cpf || "N/A"}
                          </TableCell>
                          <TableCell>{participant.email || "N/A"}</TableCell>
                          <TableCell>{ticketType}</TableCell>
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
