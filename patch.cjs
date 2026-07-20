const fs = require('fs');
const file = 'src/pages/VideoPlayerPage.tsx';
let content = fs.readFileSync(file, 'utf-8');

// 1. Add imports
content = content.replace(
  "import { loadVideoShapes, saveVideoShapes } from '../utils/videoShapeStorage';",
  `import { loadVideoShapes, saveVideoShapes } from '../utils/videoShapeStorage';
import {
  getMediaAnnotationsRequest,
  saveMediaAnnotationRequest,
  updateMediaAnnotationRequest,
  deleteMediaAnnotationRequest,
} from '../api/annotations.service';`
);

// 2. Add refs and load state inside VideoPlayerPage
content = content.replace(
  "  const [activeStamp, setActiveStamp] = useState<StampId>(STAMPS[0].id);",
  `  const [activeStamp, setActiveStamp] = useState<StampId>(STAMPS[0].id);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const prevCommentsRef = useRef<VideoComment[]>([]);
  const prevShapesRef = useRef<VideoShape[]>([]);
  const prevDrawingsRef = useRef<VideoDrawingStroke[]>([]);
  const prevStampsRef = useRef<VideoStamp[]>([]);

  const useGranularSync = <T extends { id: string }>(
    type: string,
    currentData: T[],
    prevRef: React.MutableRefObject<T[]>
  ) => {
    useEffect(() => {
      if (!initialLoadComplete || !mediaId) return;

      const current = currentData;
      const previous = prevRef.current;

      const added = current.filter(c => !previous.find(p => p.id === c.id));
      const deleted = previous.filter(p => !current.find(c => c.id === p.id));
      const updated = current.filter(c => {
        const prev = previous.find(p => p.id === c.id);
        return prev && JSON.stringify(prev) !== JSON.stringify(c);
      });

      added.forEach(c => {
        const anyC = c as any;
        const vTime = anyC.videoTimestamp !== undefined ? anyC.videoTimestamp : (anyC.timestamp !== undefined ? anyC.timestamp : null);
        saveMediaAnnotationRequest(mediaId, { 
          id: c.id, 
          type, 
          data: c,
          videoTimestamp: vTime,
          parentId: anyC.parentId || null
        }).catch(console.error);
      });

      updated.forEach(c => {
        const anyC = c as any;
        const vTime = anyC.videoTimestamp !== undefined ? anyC.videoTimestamp : (anyC.timestamp !== undefined ? anyC.timestamp : null);
        updateMediaAnnotationRequest(c.id, { 
          data: c,
          videoTimestamp: vTime,
          resolved: anyC.resolved
        }).catch(console.error);
      });

      deleted.forEach(c => {
        deleteMediaAnnotationRequest(c.id).catch(console.error);
      });

      prevRef.current = current;
    }, [currentData, mediaId, initialLoadComplete, type, prevRef]);
  };

  useGranularSync('comment', comments, prevCommentsRef);
  useGranularSync('shape', shapes, prevShapesRef);
  useGranularSync('drawing', drawings, prevDrawingsRef);
  useGranularSync('stamp', stamps, prevStampsRef);
`
);

// 3. Replace the useEffect for initialization
const oldInitEffect = `  useEffect(() => {
    if (!mediaId) return;

    const loadedComments = loadVideoComments(mediaId);
    const storedHistory = loadAnnotationHistory(mediaId);
    const syncedComments = loadedComments.map((comment) => {
      const entry = storedHistory.find(
        (item) =>
          item.id === \`comment-\${comment.id}\` || item.sourceCommentId === comment.id,
      );
      if (!entry) return comment;

      return {
        ...comment,
        resolved: comment.resolved ?? entry.resolved ?? false,
        resolvedAt: comment.resolvedAt ?? entry.resolvedAt,
        resolvedBy: comment.resolvedBy ?? entry.resolvedBy,
        reopenedAt: comment.reopenedAt ?? entry.reopenedAt,
        reopenedBy: comment.reopenedBy ?? entry.reopenedBy,
        visibility: comment.visibility ?? entry.visibility ?? DEFAULT_ANNOTATION_VISIBILITY,
        groupId: comment.groupId ?? entry.groupId,
      };
    });
    const mergedHistory = dedupeHistoryEntries(
      normalizeCommentHistory(
        mergeLinkedAnnotationHistory(
          backfillHistoryFromComments(syncedComments, storedHistory),
          syncedComments,
        ),
        syncedComments,
      ),
    );

    setComments(syncedComments);
    setDrawings(loadVideoDrawings(mediaId));
    setShapes(loadVideoShapes(mediaId));
    setStamps(loadVideoStamps(mediaId));
    setHistory(mergedHistory);
    setDraftComment(null);
    setActiveTool('select');
    resetStacks();
    setWorkspaceZoom(WORKSPACE_ZOOM_DEFAULT);
  }, [mediaId, resetStacks]);`;

const newInitEffect = `  useEffect(() => {
    if (!mediaId) return;

    const loadApiAnnotations = async () => {
      try {
        const { annotations } = await getMediaAnnotationsRequest(mediaId);
        
        const commentsData = annotations.filter(a => a.type === 'comment').map(a => a.data as VideoComment);
        const shapesData = annotations.filter(a => a.type === 'shape').map(a => a.data as VideoShape);
        const drawingsData = annotations.filter(a => a.type === 'drawing').map(a => a.data as VideoDrawingStroke);
        const stampsData = annotations.filter(a => a.type === 'stamp').map(a => a.data as VideoStamp);
        
        setComments(commentsData);
        setShapes(shapesData);
        setDrawings(drawingsData);
        setStamps(stampsData);
        
        prevCommentsRef.current = commentsData;
        prevShapesRef.current = shapesData;
        prevDrawingsRef.current = drawingsData;
        prevStampsRef.current = stampsData;
        
        setInitialLoadComplete(true);
      } catch (err) {
        console.error('Failed to load annotations from API', err);
        setInitialLoadComplete(true);
      }
    };

    loadApiAnnotations();

    const storedHistory = loadAnnotationHistory(mediaId);
    setHistory(storedHistory);
    
    setDraftComment(null);
    setActiveTool('select');
    resetStacks();
    setWorkspaceZoom(WORKSPACE_ZOOM_DEFAULT);
  }, [mediaId, resetStacks]);`;

content = content.replace(oldInitEffect, newInitEffect);

// 4. Remove local storage syncing effects
const oldLocalSyncEffects = `  useEffect(() => {
    if (!mediaId) return;
    saveVideoComments(mediaId, comments);
  }, [mediaId, comments]);

  useEffect(() => {
    if (!mediaId) return;
    saveVideoDrawings(mediaId, drawings);
  }, [mediaId, drawings]);

  useEffect(() => {
    if (!mediaId) return;
    saveVideoShapes(mediaId, shapes);
  }, [mediaId, shapes]);

  useEffect(() => {
    if (!mediaId) return;
    saveVideoStamps(mediaId, stamps);
  }, [mediaId, stamps]);`;

content = content.replace(oldLocalSyncEffects, '');

fs.writeFileSync(file, content, 'utf-8');
console.log('Patched VideoPlayerPage.tsx successfully');
