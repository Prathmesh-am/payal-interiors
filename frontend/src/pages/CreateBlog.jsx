import React, { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createBlog, fetchCategories } from "../services/blogService";
import {
  Box,
  TextField,
  Button,
  Stack,
  Chip,
  CircularProgress,
  Typography,
  Paper,
  Grid,
  Divider,
} from "@mui/material";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import MediaPickerDialog from "../components/MediaPickerDialog";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import SaveIcon from "@mui/icons-material/Save";
import PublishIcon from "@mui/icons-material/Publish";

const CreateBlogForm = () => {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);

  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [mediaDialogType, setMediaDialogType] = useState(null);

  const [status, setStatus] = useState("draft");

  const quillRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: categoriesData, isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const mutation = useMutation({
    mutationFn: createBlog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      setTitle("");
      setExcerpt("");
      setTags([]);
      setSelectedCategories([]);
      setContent("");
      setImage(null);
      setStatus("draft");
    },
    onError: (error) => console.error("Error creating blog:", error),
  });

  const handleAddTag = () => {
    if (tagInput && !tags.includes(tagInput.toLowerCase().trim())) {
      setTags([...tags, tagInput.toLowerCase().trim()]);
      setTagInput("");
    }
  };

  const handleDeleteTag = (tagToDelete) => {
    setTags(tags.filter((tag) => tag !== tagToDelete));
  };

  const handleCategorySelect = (id) => {
    setSelectedCategories(
      selectedCategories.includes(id)
        ? selectedCategories.filter((catId) => catId !== id)
        : [...selectedCategories, id]
    );
  };

  const handleImageSelect = (media) => {
    const imageUrl = `${import.meta.env.VITE_API_URL}${media.versions.medium || media.versions.original}`;

    if (mediaDialogType === "editor" && quillRef.current) {
      const editor = quillRef.current.getEditor();
      const range = editor.getSelection(true);
      if (range) {
        // Insert the image wrapped in a div with centering and smaller dimensions
        editor.insertText(range.index, "\n", "user");
        editor.insertEmbed(range.index + 1, "image", imageUrl, "user");
        editor.formatText(range.index + 1, 1, {
          width: "450px", // Reduced width to 400px for smaller size
          height: "auto",
          display: "block",
          margin: "0 auto",
        });
        editor.insertText(range.index + 2, "\n", "user");
        editor.setSelection(range.index + 3, 0);
        setContent(editor.root.innerHTML); // Update content state
      }
    }

    if (mediaDialogType === "featured") {
      setImage(media);
    }

    setMediaDialogOpen(false);
    setMediaDialogType(null);
  };

  const handleSubmit = (e, targetStatus) => {
    e.preventDefault();
    if (!title || !content) {
      alert("Title and Content are required.");
      return;
    }
    const blogData = {
      title,
      excerpt: excerpt || content.replace(/<[^>]+>/g, "").slice(0, 150),
      content,
      tags,
      categories: selectedCategories,
      status: targetStatus || status,
      featuredImage: image || null,
    };
    mutation.mutate(blogData);
  };

  const openEditorMediaDialog = () => {
    setMediaDialogType("editor");
    setMediaDialogOpen(true);
  };

  const openFeaturedMediaDialog = () => {
    setMediaDialogType("featured");
    setMediaDialogOpen(true);
  };

  const modules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
        ["link", "image", "video"],
        [{ align: [] }],
        ["clean"],
      ],
      handlers: { image: openEditorMediaDialog },
    },
    clipboard: { matchVisual: false },
  };

  return (
    <Box component="form" onSubmit={(e) => handleSubmit(e, status)} sx={{ maxWidth: 1400, mx: "auto", mt: 4, mb: 10 }}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              New Blog Post
            </Typography>
            <TextField label="Blog Title (Required)" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth required variant="filled" sx={{ mb: 3 }} />
            <Box sx={{ ".quill": { height: "500px" } }}>
              <ReactQuill ref={quillRef} theme="snow" value={content} onChange={setContent} modules={modules} placeholder="Start writing your amazing blog content here..." />
            </Box>
            <Stack direction="row" spacing={2} sx={{ mt: 7 }}>
              <Button variant="contained" color="primary" startIcon={<PublishIcon />} onClick={(e) => handleSubmit(e, "published")} disabled={mutation.isLoading || !title || !content}>
                {mutation.isLoading && status === "published" ? <CircularProgress size={24} /> : "Publish"}
              </Button>
              <Button variant="outlined" color="secondary" startIcon={<SaveIcon />} onClick={(e) => handleSubmit(e, "draft")} disabled={mutation.isLoading || !title || !content}>
                {mutation.isLoading && status === "draft" ? <CircularProgress size={24} /> : "Save Draft"}
              </Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6">Publish Status</Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography>
                Current Status: <Chip label={status.toUpperCase()} color={status === "published" ? "success" : "warning"} size="small" />
              </Typography>
            </Paper>

            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6">Excerpt / Summary</Typography>
              <TextField label="Short summary for previews" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} fullWidth multiline rows={4} placeholder="Optional. Will use the first 150 characters of content if left empty." />
            </Paper>

            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6">Featured Image</Typography>
              <Button variant="outlined" fullWidth startIcon={<ImageOutlinedIcon />} onClick={openFeaturedMediaDialog}>
                {image ? "Change Image" : "Select Image"}
              </Button>
              {image && (
                <Box sx={{ mt: 2, p: 1, border: "1px solid", borderColor: "grey.300", borderRadius: 1, textAlign: "center" }}>
                  <Typography variant="caption">{typeof image === "string" ? image.substring(0, 30) + "..." : image.name}</Typography>
                </Box>
              )}
            </Paper>

            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6">Categories</Typography>
              {categoriesLoading && <CircularProgress size={24} />}
              {categoriesError && <Typography color="error">Error loading categories</Typography>}
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                {categoriesData?.map((cat) => (
                  <Chip key={cat._id} label={cat.name} clickable color={selectedCategories.includes(cat._id) ? "primary" : "default"} variant={selectedCategories.includes(cat._id) ? "filled" : "outlined"} onClick={() => handleCategorySelect(cat._id)} sx={{ mb: 1 }} />
                ))}
              </Stack>
            </Paper>

            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6">Tags</Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <TextField label="Add Tag" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())} size="small" fullWidth />
                <Button variant="contained" onClick={handleAddTag} size="small">Add</Button>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                {tags.map((tag) => <Chip key={tag} label={tag} onDelete={() => handleDeleteTag(tag)} sx={{ mb: 1 }} />)}
              </Stack>
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      <MediaPickerDialog open={mediaDialogOpen} onClose={() => setMediaDialogOpen(false)} onSelect={handleImageSelect} />
    </Box>
  );
};

export default CreateBlogForm;