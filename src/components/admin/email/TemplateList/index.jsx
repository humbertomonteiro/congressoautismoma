// src/components/EmailSection/TemplateList.jsx
import React from "react";
import { Grid, Typography } from "@mui/material";
import TemplateCard from "../TemplateCard";

const TemplateList = ({ emailTemplates, onEdit, onDelete }) => {
  return (
    <Grid container spacing={3} sx={{ marginTop: "0" }}>
      {emailTemplates.length < 1 ? (
        <Typography
          variant="subtitle"
          sx={{
            color: "#333",
            fontWeight: 500,
            mb: 2,
            borderRadius: "12px",
            textAlign: "center",
            width: "100%",
          }}
        >
          Sem templates ainda...
        </Typography>
      ) : (
        emailTemplates.map((template) => (
          <Grid item xs={12} sm={6} md={4} key={template.id}>
            <TemplateCard
              template={template}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </Grid>
        ))
      )}
    </Grid>
  );
};

export default TemplateList;
