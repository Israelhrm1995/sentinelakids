import React from 'react';
import { Button, Box, Typography } from '@mui/material';

interface ImageUploadProps {
  label: string;
  previewUrl: string | null;
  onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  maxSizeKB: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ label, previewUrl, onSelect, onRemove, maxSizeKB }) => {
  return (
    <Box mt={2} mb={2} display="flex" flexDirection="column" alignItems="center">
      <Typography variant="subtitle2" mb={1}>{label} (opcional, máx. {maxSizeKB}KB)</Typography>
      <input
        accept="image/*"
        style={{ display: 'none' }}
        id={`upload-${label.replace(/\s/g, '').toLowerCase()}`}
        type="file"
        onChange={onSelect}
      />
      <label htmlFor={`upload-${label.replace(/\s/g, '').toLowerCase()}`}> 
        <Button variant="outlined" component="span" sx={{ mb: 1 }}>{label}</Button>
      </label>
      {previewUrl && (
        <>
          <img src={previewUrl} alt={label} style={{ maxHeight: 100, borderRadius: 8, border: '1px solid #ccc', marginBottom: 8 }} />
          <Button color="error" variant="outlined" onClick={onRemove} sx={{ mb: 1 }}>
            Remover {label}
          </Button>
        </>
      )}
    </Box>
  );
};

export default ImageUpload;
