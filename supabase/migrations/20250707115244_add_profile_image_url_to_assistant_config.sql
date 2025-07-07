-- Add profile_image_url column to assistant_config table
ALTER TABLE public.assistant_config 
ADD COLUMN profile_image_url TEXT;

-- Add a comment to describe the column
COMMENT ON COLUMN public.assistant_config.profile_image_url IS 'URL or base64 data URI for the chat profile image that appears in welcome messages';
