import React from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  LinearProgress,
  Box,
} from "@mui/material";
import { MdDelete, MdEdit } from "react-icons/md";
import useRole from "../../../../data/hooks/useRole";

const TemplateCard = ({ template, onEdit, onDelete }) => {
  const { canEdit, canDelete } = useRole();
  const getStatusColor = (template) => {
    switch (template.statusFilter) {
      case "approved":
        return { borderLeft: "6px solid #2E7D32", progressColor: "#2E7D32" };
      case "pending":
        return { borderLeft: "6px solid #FFB300", progressColor: "#FFB300" };
      case "error":
        return { borderLeft: "6px solid #D32F2F", progressColor: "#D32F2F" };
      default:
        return { borderLeft: "6px solid #B0BEC5", progressColor: "#B0BEC5" };
    }
  };

  const { borderLeft, progressColor } = getStatusColor(template);

  return (
    <Card
      sx={{
        height: "100%",
        backgroundColor: "#FFFFFF",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        border: "1px solid #c2c2c2",
        borderLeft,
        transition: "transform 0.2s",
        "&:hover": { transform: "scale(1.02)" },
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ color: "#333", fontWeight: 500, mb: 1 }}>
          {template.subject}
        </Typography>
        <Typography variant="body2" sx={{ color: "#666", fontSize: "0.9rem" }}>
          <strong>Título:</strong> {template.title || "Sem título"}
        </Typography>
        <Typography variant="body2" sx={{ color: "#666", fontSize: "0.9rem" }}>
          <strong>Filtro:</strong> {template.statusFilter || "-"}
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Typography
            variant="body2"
            sx={{ color: "#666", fontSize: "0.9rem" }}
          >
            <strong>Progresso:</strong> {template.sentCount || 0}/
            {template.totalTarget || 0} ({template.progress || 0}%)
          </Typography>
          <LinearProgress
            variant="determinate"
            value={template.progress || 0}
            sx={{
              mt: 1,
              height: 8,
              borderRadius: 4,
              backgroundColor: "#E0E0E0",
              "& .MuiLinearProgress-bar": { backgroundColor: progressColor },
            }}
          />
        </Box>
      </CardContent>
      <CardActions sx={{ justifyContent: "flex-end", p: 2, pt: 0 }}>
        {canEdit && (
          <IconButton
            onClick={() => onEdit(template)}
            sx={{ color: "#1976D2", "&:hover": { color: "#1565C0" } }}
          >
            <MdEdit />
          </IconButton>
        )}
        {canDelete && (
          <IconButton
            onClick={() => onDelete(template.id)}
            sx={{ color: "#D32F2F", "&:hover": { color: "#B71C1C" } }}
          >
            <MdDelete />
          </IconButton>
        )}
      </CardActions>
    </Card>
  );
};

export default TemplateCard;
