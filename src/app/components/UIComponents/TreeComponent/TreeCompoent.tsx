import React from "react";
import { TreeStructureComponent } from "@/app/types/types";
import styles from "./TreeComponent.module.scss";
interface TreeStructureComponentProps {
  readonly component: TreeStructureComponent;
}
const TreeStructure = ({ component }: TreeStructureComponentProps) => {
  const fakeTree = [
    {
      id: "1",
      label: "Parent 1",
      children: [
        { id: "1-1", label: "Child 1" },
        { id: "1-2", label: "Child 2" },
      ],
    },
  ];

  const renderNode = (node: any) => (
    <li key={node.id} style={{ fontSize: 12 }}>
      <span>{node.label}</span>
      {node.children && (
        <ul style={{ marginLeft: 12, marginTop: 4 }}>
          {node.children.map(renderNode)}
        </ul>
      )}
    </li>
  );
  return (
    <div className={styles.builderCard} data-testid="treeStructure">
      <div className={styles.header}>
        <div className={styles.title}>{component.properties.label}</div>
      </div>

      <div className={styles.body}>
        <div className={styles.treePreview}>
          <ul className={styles.treeList}>{fakeTree.map(renderNode)}</ul>
        </div>
      </div>
    </div>
  );
};

export default TreeStructure;
