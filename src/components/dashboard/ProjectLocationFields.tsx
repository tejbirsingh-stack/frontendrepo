import { cv } from '../../theme/cssVars';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Typography,
} from '@mui/material';
import type { MediaLocation, SidebarFolder } from '../../data/mockMedia';

const fieldLabelSx = {
  display: 'block',
  mb: 0.75,
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: cv.textSecondary,
};

const selectSx = {
  borderRadius: '10px',
  backgroundColor: cv.surface,
  '& .MuiOutlinedInput-notchedOutline': { borderColor: cv.border },
};

interface ProjectLocationFieldsProps {
  projectId: string;
  projectFolders: SidebarFolder[];
  onProjectChange: (projectId: string) => void;
}

export default function ProjectLocationFields({
  projectId,
  projectFolders,
  onProjectChange,
}: ProjectLocationFieldsProps) {
  return (
    <>
      <Typography sx={{ ...fieldLabelSx, mt: 2 }}>Project (optional)</Typography>
      <FormControl fullWidth size="small">
        <InputLabel id="project-location-project-label" shrink>
          Project
        </InputLabel>
        <Select
          labelId="project-location-project-label"
          label="Project"
          value={projectId}
          onChange={(event: SelectChangeEvent) => onProjectChange(event.target.value)}
          displayEmpty
          sx={selectSx}
          renderValue={(value) => {
            if (!value) return 'None';
            return projectFolders.find((folder) => folder.id === value)?.label ?? value;
          }}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {projectFolders.map((folder) => (
            <MenuItem key={folder.id} value={folder.id}>
              {folder.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  );
}

export function buildProjectLocation(projectId: string): MediaLocation | null {
  if (!projectId) return null;
  return { folderId: projectId };
}
