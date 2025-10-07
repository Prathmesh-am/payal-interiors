import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  TextField, // Used for new fields
  Tabs,
  Tab,
  Box,
  Stack,
  Chip,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMedia, uploadMedia } from "../services/mediaService";

const MediaPickerDialog = ({ open, onClose, onSelect }) => {
  const queryClient = useQueryClient();
  const [selectedMediaId, setSelectedMediaId] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedTag, setSelectedTag] = useState("");

  const { data: mediaList = [], isLoading, error } = useQuery({
    queryKey: ["media"],
    queryFn: fetchMedia,
    enabled: Boolean(open), // ✅ Fix: ensure enabled is a boolean
  });

  const allTags = useMemo(() => {
    const tagSet = new Set();
    mediaList.forEach((m) => (m.tags || []).forEach((t) => tagSet.add(t)));
    return Array.from(tagSet);
  }, [mediaList]);

  const filteredMedia = useMemo(() => {
    if (!selectedTag) return mediaList;
    return mediaList.filter((m) => m.tags?.includes(selectedTag));
  }, [selectedTag, mediaList]);

  const handleSelectMedia = (media) => {
    setSelectedMediaId(media._id);
    onSelect({
      _id: media._id,
      versions: media.versions,
      tags: media.tags,
      filename: media.filename,
      // Pass new fields if available, though old component didn't select them
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Insert Media</DialogTitle>

      <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)} variant="fullWidth">
        <Tab label="Media Library" />
        <Tab label="Upload New" />
      </Tabs>

      <DialogContent dividers>
        {activeTab === 0 && (
          <MediaLibraryView
            mediaList={filteredMedia}
            allTags={allTags}
            isLoading={isLoading}
            error={error}
            selectedMediaId={selectedMediaId}
            handleSelectMedia={handleSelectMedia}
            selectedTag={selectedTag}
            setSelectedTag={setSelectedTag}
          />
        )}

        {/* // 🚀 UPLOAD VIEW IS MODIFIED HERE 🚀
        */}
        {activeTab === 1 && <UploadView queryClient={queryClient} setActiveTab={setActiveTab} />}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

// --- MediaLibraryView remains unchanged ---
const MediaLibraryView = ({
  mediaList,
  allTags,
  isLoading,
  error,
  selectedMediaId,
  handleSelectMedia,
  selectedTag,
  setSelectedTag,
}) => {
  if (isLoading) return <CircularProgress />;
  if (error) return <p>Error loading media.</p>;
  if (mediaList.length === 0) return <p>No media available.</p>;

  return (
    <Box>
      {allTags.length > 0 && (
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Filter by Tag</InputLabel>
          <Select value={selectedTag} label="Filter by Tag" onChange={(e) => setSelectedTag(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {allTags.map((tag) => (
              <MenuItem key={tag} value={tag}>
                {tag}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <ImageList cols={4} gap={12}>
        {mediaList.map((media) => (
          <ImageListItem
            key={media._id}
            onClick={() => handleSelectMedia(media)}
            style={{
              cursor: "pointer",
              border: selectedMediaId === media._id ? "3px solid #1976d2" : "1px solid #ccc",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <img
              src={`${import.meta.env.VITE_API_URL}${media.versions.thumbnail}`}
              alt={media.filename}
              loading="lazy"
            />
            <ImageListItemBar
              title={media.filename}
              subtitle={
                media.tags?.length > 0
                  ? media.tags.map((t) => <Chip key={t} label={t} size="small" sx={{ mr: 0.5 }} />)
                  : null
              }
            />
          </ImageListItem>
        ))}
      </ImageList>

      {mediaList.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          No media found for this tag.
        </Typography>
      )}
    </Box>
  );
};

// --- UploadView is updated to include new metadata fields ---
const UploadView = ({ queryClient, setActiveTab }) => {
  const [uploadData, setUploadData] = useState({
    file: null,
    title: "", // New field
    description: "", // New field
    altText: "", // New field
    tags: [],
  });
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  // NOTE: The uploadMedia service function must be updated to accept the new fields
  // uploadMedia(file, tags, title, description, altText)
  const mutation = useMutation({
    mutationFn: ({ file, tags, title, description, altText }) => 
      uploadMedia(file, tags, title, description, altText),
    onSuccess: (newMedia) => {
      queryClient.setQueryData(["media"], (old = []) => [newMedia, ...old]);
      resetUploadForm();
      setActiveTab(0); // Switch back to Media Library
    },
  });

  const resetUploadForm = () => {
    setUploadData({ file: null, title: "", description: "", altText: "", tags: [] });
    setPreviewUrl(null);
    setUploading(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadData(prev => ({ 
        ...prev, 
        file,
        // Set a default title from filename for convenience
        title: file.name.split('.').slice(0, -1).join('.'), 
      }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleTagsChange = (e) => {
    const tagsArray = e.target.value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    setUploadData(prev => ({ ...prev, tags: tagsArray }));
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUploadData(prev => ({ ...prev, [name]: value }));
  };


  const handleFileUpload = async () => {
    if (!uploadData.file) return alert("Please select a file first.");
    setUploading(true);
    
    // Ensure all data is ready for the API
    const { file, tags, title, description, altText } = uploadData;
    const tagsString = tags.join(",");
    
    try {
      await mutation.mutateAsync({ 
        file, 
        tags: tagsString, // API likely expects a string
        title, 
        description, 
        altText 
      });
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  const selectedFile = uploadData.file;
  const isReadyToUpload = selectedFile && uploadData.title;

  return (
    <Stack spacing={2} mt={2}>
      {!selectedFile && (
        <Button variant="contained" component="label" disabled={uploading} sx={{ width: "fit-content" }}>
          Select File
          <input type="file" hidden accept="image/*" onChange={handleFileSelect} />
        </Button>
      )}

      {selectedFile && (
        <Paper variant="outlined" sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
          <img src={previewUrl} alt="Preview" style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 8 }} />
          <Box>
            <Typography variant="body1">{selectedFile.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {(selectedFile.size / 1024).toFixed(2)} KB
            </Typography>
          </Box>
        </Paper>
      )}

      {/* --- NEW FIELDS START --- */}
      <TextField 
        label="Title" 
        name="title"
        value={uploadData.title} 
        onChange={handleInputChange} 
        fullWidth 
        size="small"
        required
        disabled={!selectedFile}
      />
      
      <TextField 
        label="Alt Text (Required for Accessibility)" 
        name="altText"
        value={uploadData.altText} 
        onChange={handleInputChange} 
        fullWidth 
        size="small"
        disabled={!selectedFile}
      />
      
      <TextField 
        label="Description (Optional)" 
        name="description"
        value={uploadData.description} 
        onChange={handleInputChange} 
        fullWidth 
        multiline
        rows={2}
        size="small"
        disabled={!selectedFile}
      />
      {/* --- NEW FIELDS END --- */}
      
      <TextField 
        label="Tags (comma separated)" 
        value={uploadData.tags.join(", ")} 
        onChange={handleTagsChange} 
        fullWidth 
        size="small" 
        disabled={!selectedFile}
      />

      {selectedFile && (
        <Stack direction="row" spacing={2}>
          <Button 
            variant="contained" 
            onClick={handleFileUpload} 
            disabled={uploading || !isReadyToUpload}
          >
            {uploading ? "Uploading..." : "Upload File"}
          </Button>
          <Button variant="outlined" onClick={resetUploadForm} disabled={uploading}>
            Cancel
          </Button>
        </Stack>
      )}
    </Stack>
  );
};

export default MediaPickerDialog;