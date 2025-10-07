import React from 'react';
import { Card, CardMedia, CardContent, CardActions, Typography, Button, Stack, Chip, Box } from '@mui/material';

const BlogCard = ({ blog }) => {
  const imageUrl = blog.featuredImage?.thumbnail
    ? `${import.meta.env.VITE_API_URL}${blog.featuredImage.small}`
    : '/default-blog.png';

  // Define fixed dimensions for consistency
  const CARD_WIDTH = 345;
  const CARD_HEIGHT = 450; // Choose a height that accommodates your content without overflow

  return (
    <Card sx={{ 
        width: CARD_WIDTH, 
        height: CARD_HEIGHT, 
        display: 'flex', 
        flexDirection: 'column' 
    }}>
      <CardMedia
        component="img"
        height="180" // Fixed height for the image
        image={imageUrl}
        alt={blog.title}
      />
      
      {/* Use Box to manage the content area and ensure it takes available space */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flexGrow: 1, paddingBottom: 0 }}>
          <Typography 
            gutterBottom 
            variant="h6" 
            component="div"
            // Constrain the title to a certain number of lines (e.g., 2)
            sx={{ 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                display: '-webkit-box', 
                WebkitLineClamp: 2, 
                WebkitBoxOrient: 'vertical',
                minHeight: '2.5em' // Prevent height shift if title is short
            }}
          >
            {blog.title}
          </Typography>

          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
                mb: 1,
                // Constrain the excerpt to a certain number of lines (e.g., 3)
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                display: '-webkit-box', 
                WebkitLineClamp: 3, 
                WebkitBoxOrient: 'vertical',
                minHeight: '4.5em' // Prevent height shift if excerpt is short
            }}
          >
            {blog.excerpt}
          </Typography>

          {blog.tags?.length > 0 && (
            <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap', maxHeight: '32px', overflow: 'hidden' }}>
              {blog.tags.map((tag) => (
                <Chip key={tag} label={tag} size="small" />
              ))}
            </Stack>
          )}
        
          <Typography variant="caption" color="text.secondary">
            By {blog.author?.name} • {new Date(blog.publishedAt).toLocaleDateString()}
          </Typography>
        </CardContent>

        <CardActions sx={{ marginTop: 'auto' }}>
          <Button size="small">Read More</Button>
        </CardActions>
      </Box>
    </Card>
  );
};

export default BlogCard;