
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TreeStructureComponent } from '../../../types/types';

import TreeStructure from './TreeCompoent'
const mockComponent: TreeStructureComponent = {
  properties: {
    showLabel: true,
    label: 'Test Tree Title',
    apiName: '',
    childrenPathKey: '',
    behaviorType: '',
    apiUrl: '',
    apiHeaders: ''
  } ,
    type: 'tree-structure',
    id: '',
    category: ''
};

describe('TreeStructure', () => {
  test('renders builderCard container with header and body', () => {
    render(<TreeStructure component={mockComponent} />);
    expect(screen.getByTestId("treeStructure")).toBeInTheDocument();
  });

  test('displays component title in header', () => {
    render(<TreeStructure component={mockComponent} />);
    
    const titleElement = screen.getByText('Test Tree Title');
    expect(titleElement).toBeInTheDocument();
  });

  test('renders parent and child tree nodes correctly', () => {
    render(<TreeStructure component={mockComponent} />);
    
    expect(screen.getByText('Parent 1')).toBeInTheDocument();
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
  });
 
  test('renders leaf nodes without nested ul', () => {
    render(<TreeStructure component={mockComponent} />);
    
    const child1 = screen.getByText('Child 1').closest('li');
    const child2 = screen.getByText('Child 2').closest('li');
  });
});
