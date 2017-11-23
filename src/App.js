import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import SortableTree, { removeNodeAtPath } from 'react-sortable-tree';
import NewCompForm from './NewCompForm';
import './App.css'
const IPC = require('electron').ipcRenderer;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      treeData: [{
        title: 'App',
        expanded: true,
        children: []
      }],
      newName: '',
      newParent: '-'
    };
    this.extractCompNames = this.extractCompNames.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSelectChange = this.handleSelectChange.bind(this);
    this.formatName = this.formatName.bind(this);
    this.searchTreeData = this.searchTreeData.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.exportFiles = this.exportFiles.bind(this);
    this.saveFile = this.saveFile.bind(this);
    this.openFile = this.openFile.bind(this);

  }

  // shouldComponentUpdate(nextProps, nextState) {
  //     const vitalStateChange = this.state.treeData !== nextState.treeData;
  //     return vitalStateChange;
  // }

  // Helper function creates an array of all component names
  extractCompNames(components, flattened = [], cache = {}) {
    components.forEach((element, index) => {
      let name =
      element.title
      // .toUpperCase()
      if (!cache[name]) {
        cache[name] = true;
        flattened.push(element.title);
        this.extractCompNames(components[index].children, flattened, cache);
      }
    })
    return flattened;
  }

  // Updates a placeholder in state with text input value.
  handleInputChange(e) {
    this.setState({ newName: e.target.value })
  }

  // Updates a placeholder in state with selected value.
  handleSelectChange(e) {
    this.setState({ newParent: e.target.value })
  }

  // Formats casing and spacing, and removes file extenions from input
  formatName(userInput) {
    let result = userInput
    .replace(/^./g, x => x.toUpperCase())
    //.charAt(0).toUpperCase() + userInput.slice(1)
    .replace(/\ \w/g, x => x[1].toUpperCase())
    .replace(/\..+$/, '');
    return result
  }

  // Helper function finds parent in state, and update with new child element
  searchTreeData(data, target, newName) {
    let formattedName = this.formatName(newName)
    // if tree is empty, create first component at top-level
    for (let i = 0; i < data.length; i += 1) {
      // console.log('i: ', i, '; data: ', data[i]);
      let title = data[i].title
      if (title === target) {
        data[i].children.push({
          title: formattedName,
          expanded: true,
          children: []
        })
      }
      if (data[i].children) {
        this.searchTreeData(data[i].children, target, newName);
      }
    };
  }

  // Submits form data and updates state with new component details.
  handleSubmit(e) {
    e.preventDefault()
    const newName = this.state.newName
    const newParent = this.state.newParent
    const target = this.state.newParent;
    const tree = this.state.treeData.slice();
    if (newName === '') {
      alert('Please enter a component name.')
    }
    else if (newParent === '-' || tree.length === 0) {
      tree.push({
        title: this.formatName(newName),
        expanded: true,
        children: []
      })
      this.setState({ treeData: tree })
    }
    else {
      this.searchTreeData(tree, target, newName)
      this.setState({ treeData: tree })
    }
    this.setState({ newName: '' })
  }

  //function for sending data to Electron server
  exportFiles(e) {
    e.preventDefault()
    IPC.send('componentTree', this.state.treeData);
  }
  saveFile(e) {
    e.preventDefault()
    IPC.send('saveFile', this.state.treeData);
  }
  openFile(e) {
    e.preventDefault()
    IPC.send('openFile','');
}
componentDidMount() {
    IPC.on('fileData', (event,data)=> {
      this.setState({treeData:data});
   })

}
  render() {

    // Nodekey used to identify node to be removed.
    const getNodeKey = ({ treeIndex }) => treeIndex;

    return (
      <div className='top-container'>
        <div className='top-spacer'>
          <div className='left-spacer' />
          <div className='right-spacer'>
            <div className='filler-a' />
            <div className='filler-b' />
          </div>
        </div>
        <div className='container'>
          <NewCompForm
            newName={this.state.newName}
            newParent={this.state.newParent}
            extractCompNames={this.extractCompNames}
            handleInputChange={this.handleInputChange}
            handleSelectChange={this.handleSelectChange}
            handleSubmit={this.handleSubmit}
            components={this.state.treeData}
            exportFiles={this.exportFiles}
            openFile={this.openFile}
            saveFile={this.saveFile}
            />
          <div className='tree-container'>
            <SortableTree
              className='sortable-tree'
              treeData={this.state.treeData}
              onChange={treeData => this.setState({ treeData })}
              // button for removing component
              generateNodeProps={({ node, path }) => ({
                buttons: [
                  <button className="deleteButton" onClick={() => this.setState(state => ({
                      treeData: removeNodeAtPath({
                        treeData:
                        state.treeData,
                        path,
                        getNodeKey,
                      }),
                    }))}
                    >X</button>,
                  ],
                })}
                />
              <div className='logo-container'>
                <img className='logo' src={require('../assets/logo/48x48.png')} alt='logo'></img>
              </div>

          </div>
          </div>
        </div>
      );
    }
  }

  export default App;
