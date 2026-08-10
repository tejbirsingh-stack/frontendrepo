import type { ManagedTag, TagScope } from '../types/managedTag';

export interface TagTreeNode {
  tag: ManagedTag;
  children: TagTreeNode[];
}

/**
 * Build a forest from tags using real parentId links only.
 * Hierarchy must be built on the full set — never after filtering by scope —
 * otherwise children whose parent has a different scope become false roots.
 */
export function buildTagForest(tags: ManagedTag[]): TagTreeNode[] {
  const tagsById = new Map(tags.map((tag) => [tag.id, tag]));
  const childrenMap = new Map<string, ManagedTag[]>();
  const roots: ManagedTag[] = [];

  tags.forEach((tag) => {
    if (tag.parentId && tagsById.has(tag.parentId)) {
      const siblings = childrenMap.get(tag.parentId) || [];
      siblings.push(tag);
      childrenMap.set(tag.parentId, siblings);
    } else {
      roots.push(tag);
    }
  });

  const toNode = (tag: ManagedTag): TagTreeNode => ({
    tag,
    children: (childrenMap.get(tag.id) || [])
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(toNode),
  });

  return roots
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(toNode);
}

/** Place each tree under its root tag's scope (Company / Project / Personal). */
export function groupForestByRootScope(
  forest: TagTreeNode[],
): Record<TagScope, TagTreeNode[]> {
  const grouped: Record<TagScope, TagTreeNode[]> = {
    company: [],
    project: [],
    personal: [],
  };

  forest.forEach((node) => {
    grouped[node.tag.scope].push(node);
  });

  return grouped;
}

export function countDescendants(node: TagTreeNode): number {
  return node.children.reduce(
    (total, child) => total + 1 + countDescendants(child),
    0,
  );
}

export function countSelectedDescendants(
  node: TagTreeNode,
  selectedNames: Set<string> | ReadonlySet<string>,
): number {
  return node.children.reduce((total, child) => {
    const self = selectedNames.has(child.tag.name) ? 1 : 0;
    return total + self + countSelectedDescendants(child, selectedNames);
  }, 0);
}

/**
 * Ensure every assignable tag's parent chain is present so parentId links
 * resolve even when a parent has a different scope/workspace.
 */
export function withAncestorTags(
  assignable: ManagedTag[],
  allTags: ManagedTag[],
): ManagedTag[] {
  const byId = new Map(allTags.map((tag) => [tag.id, tag]));
  const result = new Map(assignable.map((tag) => [tag.id, tag]));

  assignable.forEach((tag) => {
    let parentId = tag.parentId;
    while (parentId) {
      if (result.has(parentId)) break;
      const parent = byId.get(parentId);
      if (!parent) break;
      result.set(parent.id, parent);
      parentId = parent.parentId;
    }
  });

  return Array.from(result.values());
}
