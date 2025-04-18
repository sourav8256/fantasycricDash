document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('tracker-container');
    const commandInput = document.querySelector('.command-input');
    const commandFeedback = document.querySelector('.command-feedback');
    const MAX_ITEMS_PER_ROW = 10;
    let rowCount = 1;
    let sectionCount = 1;

    function createSection(number) {
        const section = document.createElement('div');
        section.className = 'section';
        
        const header = document.createElement('div');
        header.className = 'section-header';
        header.contentEditable = true;
        header.textContent = `${number}. Section ${number}`;
        
        const rowsContainer = document.createElement('div');
        rowsContainer.className = 'section-rows';
        
        // Add initial row to the section
        rowsContainer.appendChild(createNewRow(rowCount++));
        
        section.appendChild(header);
        section.appendChild(rowsContainer);
        return section;
    }

    function createRowId(id) {
        const rowId = document.createElement('div');
        rowId.className = 'row-id';
        rowId.textContent = id;
        rowId.addEventListener('click', (e) => {
            if (e.target === rowId) {
                const row = rowId.parentElement;
                row.classList.toggle('folded');
                saveTrackerData(); // Save the state when toggling
            } else {
                showEntriesPopup(id);
            }
        });
        return rowId;
    }

    function createFoldIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'fold-indicator';
        indicator.textContent = '▼';
        indicator.addEventListener('click', (e) => {
            e.stopPropagation();
            const row = indicator.parentElement;
            row.classList.toggle('folded');
            indicator.textContent = row.classList.contains('folded') ? '▶' : '▼';
        });
        return indicator;
    }

    function showEntriesPopup(idElement) {
        const row = idElement.parentElement;
        const blocks = Array.from(row.querySelectorAll('.arrow-block'));
        const entries = blocks.map(block => block.textContent.trim()).filter(text => text);

        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        
        const popup = document.createElement('div');
        popup.className = 'entries-popup';
        
        const title = document.createElement('h3');
        title.textContent = `Entries for Row ${idElement.textContent}`;
        
        const list = document.createElement('ul');
        list.className = 'entries-list';
        
        entries.forEach(entry => {
            const li = document.createElement('li');
            li.textContent = entry;
            list.appendChild(li);
        });

        popup.appendChild(title);
        popup.appendChild(list);
        document.body.appendChild(overlay);
        document.body.appendChild(popup);

        overlay.addEventListener('click', () => {
            document.body.removeChild(overlay);
            document.body.removeChild(popup);
        });
    }

    function createArrowBlock(content = '') {
        const block = document.createElement('div');
        block.className = 'arrow-block';
        block.contentEditable = true;
        block.textContent = content;
        return block;
    }

    function createNewRow(id) {
        const row = document.createElement('div');
        row.className = 'tracker-row';
        
        const idElement = createRowId(id);
        const arrowBlock = createArrowBlock();
        
        row.appendChild(idElement);
        row.appendChild(arrowBlock);
        
        return row;
    }

    function saveTrackerData() {
        const data = {
            version: "1.0",
            sections: Array.from(container.querySelectorAll('.section')).map(section => {
                const header = section.querySelector('.section-header');
                // Remove the number prefix when saving
                const headerText = header.textContent.replace(/^\d+\.\s*/, '');
                const rows = Array.from(section.querySelectorAll('.tracker-row')).map(row => {
                    const id = row.querySelector('.row-id').textContent;
                    const blocks = Array.from(row.querySelectorAll('.arrow-block'))
                        .map(block => block.textContent);
                    const isFolded = row.classList.contains('folded');
                    return {
                        id: parseInt(id),
                        blocks: blocks,
                        folded: isFolded
                    };
                });
                return {
                    header: headerText,
                    rows: rows
                };
            })
        };
        localStorage.setItem('trackerData', JSON.stringify(data));
    }

    function loadTrackerData() {
        const savedData = localStorage.getItem('trackerData');
        if (!savedData) {
            container.appendChild(createSection(1));
            return;
        }

        try {
            const data = JSON.parse(savedData);
            
            // Handle both new and old data formats
            let sections;
            if (data.version === "1.0" && Array.isArray(data.sections)) {
                sections = data.sections;
            } else if (Array.isArray(data)) {
                sections = data;
            } else {
                console.error('Invalid data structure in localStorage');
                container.appendChild(createSection(1));
                return;
            }

            container.innerHTML = '';
            
            // Reset counters based on loaded data
            rowCount = 1;
            sectionCount = 1;
            
            sections.forEach((sectionData, index) => {
                if (!sectionData || typeof sectionData !== 'object') {
                    console.error('Invalid section data at index:', index);
                    return;
                }

                const section = createSection(index + 1);
                const header = section.querySelector('.section-header');
                
                // Add the number prefix only when rendering
                header.textContent = `${index + 1}. ${sectionData.header || `Section ${index + 1}`}`;
                
                const rowsContainer = section.querySelector('.section-rows');
                
                // Remove the initial row since we're loading saved data
                rowsContainer.innerHTML = '';
                
                if (Array.isArray(sectionData.rows)) {
                    sectionData.rows.forEach(rowData => {
                        if (!rowData || typeof rowData !== 'object') {
                            console.error('Invalid row data in section:', index);
                            return;
                        }

                        const row = document.createElement('div');
                        row.className = 'tracker-row';
                        
                        // Set folded state based on the flag
                        if (rowData.folded) {
                            row.classList.add('folded');
                        }
                        
                        const idElement = createRowId(rowData.id || rowCount);
                        row.appendChild(idElement);
                        
                        if (Array.isArray(rowData.blocks)) {
                            rowData.blocks.forEach(blockContent => {
                                row.appendChild(createArrowBlock(blockContent));
                            });
                        }
                        
                        rowsContainer.appendChild(row);
                        
                        // Update rowCount to be the highest ID + 1
                        rowCount = Math.max(rowCount, (rowData.id || 0) + 1);
                    });
                }
                
                container.appendChild(section);
                sectionCount = index + 2; // Set to next section number
            });

            // If no sections were loaded, create initial section
            if (container.children.length === 0) {
                container.appendChild(createSection(1));
            }
        } catch (error) {
            console.error('Error loading saved data:', error);
            container.appendChild(createSection(1));
        }
    }

    function handleTab(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            const currentBlock = e.target;
            const row = currentBlock.parentElement;
            
            if (row.children.length - 1 >= MAX_ITEMS_PER_ROW) {
                row.removeChild(row.children[1]);
            }
            
            const newBlock = createArrowBlock();
            row.insertBefore(newBlock, currentBlock.nextSibling);
            newBlock.focus();
            saveTrackerData();
        }
    }

    function handleEnter(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const currentRow = e.target.parentElement;
            const section = currentRow.closest('.section');
            const rowsContainer = section.querySelector('.section-rows');
            const newRow = createNewRow(rowCount++);
            rowsContainer.insertBefore(newRow, currentRow.nextSibling);
            newRow.children[1].focus();
            saveTrackerData();
        }
    }

    function handleBackspace(e) {
        if (e.key === 'Backspace' && e.target.textContent.trim() === '') {
            e.preventDefault();
            const currentBlock = e.target;
            const row = currentBlock.parentElement;
            const section = row.closest('.section');
            const rowsContainer = section.querySelector('.section-rows');
            
            // Don't allow deletion if it's the last row in the section
            if (rowsContainer.children.length > 1) {
                const prevBlock = currentBlock.previousElementSibling;
                row.removeChild(currentBlock);
                if (prevBlock && prevBlock.classList.contains('arrow-block')) {
                    prevBlock.focus();
                }
                saveTrackerData();
            }
        }
    }

    function handleCommandInput(e) {
        if (e.key === 'Enter') {
            const command = e.target.value.trim().toLowerCase();
            if (command === 'show data') {
                const savedData = localStorage.getItem('trackerData');
                if (savedData) {
                    try {
                        const data = JSON.parse(savedData);
                        console.log('Current Tracker Data:', data);
                        commandFeedback.textContent = 'Data logged to console. Press F12 to view.';
                        commandFeedback.className = 'command-feedback success';
                    } catch (error) {
                        console.error('Error parsing saved data:', error);
                        commandFeedback.textContent = 'Error parsing saved data.';
                        commandFeedback.className = 'command-feedback error';
                    }
                } else {
                    commandFeedback.textContent = 'No data found in localStorage.';
                    commandFeedback.className = 'command-feedback error';
                }
            } else if (command.startsWith('fold line ')) {
                const lineNumber = parseInt(command.substring('fold line '.length).trim());
                if (isNaN(lineNumber)) {
                    commandFeedback.textContent = 'Invalid line number. Use "fold line [number]".';
                    commandFeedback.className = 'command-feedback error';
                    e.target.value = '';
                    return;
                }

                const rowIds = Array.from(document.querySelectorAll('.row-id'));
                const rowToFold = rowIds.find(row => row.textContent.trim() === lineNumber.toString());
                
                if (rowToFold) {
                    const row = rowToFold.parentElement;
                    row.classList.add('folded');
                    saveTrackerData(); // Save the state after folding
                    commandFeedback.textContent = `Line ${lineNumber} folded.`;
                    commandFeedback.className = 'command-feedback success';
                } else {
                    commandFeedback.textContent = `Line ${lineNumber} not found.`;
                    commandFeedback.className = 'command-feedback error';
                }
            } else if (command.startsWith('unfold line ')) {
                const lineNumber = parseInt(command.substring('unfold line '.length).trim());
                if (isNaN(lineNumber)) {
                    commandFeedback.textContent = 'Invalid line number. Use "unfold line [number]".';
                    commandFeedback.className = 'command-feedback error';
                    e.target.value = '';
                    return;
                }

                const rowIds = Array.from(document.querySelectorAll('.row-id'));
                const rowToUnfold = rowIds.find(row => row.textContent.trim() === lineNumber.toString());
                
                if (rowToUnfold) {
                    const row = rowToUnfold.parentElement;
                    row.classList.remove('folded');
                    saveTrackerData(); // Save the state after unfolding
                    commandFeedback.textContent = `Line ${lineNumber} unfolded.`;
                    commandFeedback.className = 'command-feedback success';
                } else {
                    commandFeedback.textContent = `Line ${lineNumber} not found.`;
                    commandFeedback.className = 'command-feedback error';
                }
            } else if (command.startsWith('create section ')) {
                const restOfCommand = command.substring('create section '.length).trim();
                let sectionName;
                
                // Check if the section name is in quotes
                if (restOfCommand.startsWith('"') && restOfCommand.endsWith('"')) {
                    sectionName = restOfCommand.substring(1, restOfCommand.length - 1);
                } else if (restOfCommand === '') {
                    // If no name provided, use default name without number
                    sectionName = `Section ${sectionCount}`;
                } else {
                    sectionName = restOfCommand;
                }
                
                const newSection = createSection(sectionCount);
                const header = newSection.querySelector('.section-header');
                // Add the number prefix only when rendering
                header.textContent = `${sectionCount}. ${sectionName}`;
                container.appendChild(newSection);
                sectionCount++;
                
                commandFeedback.textContent = `Section "${sectionName}" created successfully.`;
                commandFeedback.className = 'command-feedback success';
                saveTrackerData();
            } else if (command.startsWith('delete section ')) {
                const restOfCommand = command.substring('delete section '.length).trim();
                let sectionName;
                
                // Check if the section name is in quotes
                if (restOfCommand.startsWith('"') && restOfCommand.endsWith('"')) {
                    sectionName = restOfCommand.substring(1, restOfCommand.length - 1);
                } else {
                    sectionName = restOfCommand;
                }
                
                const sections = Array.from(container.querySelectorAll('.section'));
                const sectionToDelete = sections.find(section => {
                    const headerText = section.querySelector('.section-header').textContent;
                    return headerText.substring(headerText.indexOf('.') + 2).toLowerCase() === sectionName.toLowerCase();
                });

                if (sectionToDelete) {
                    if (container.children.length > 1) {
                        container.removeChild(sectionToDelete);
                        // Renumber remaining sections
                        const remainingSections = Array.from(container.querySelectorAll('.section'));
                        remainingSections.forEach((section, index) => {
                            const header = section.querySelector('.section-header');
                            const currentName = header.textContent.substring(header.textContent.indexOf('.') + 2);
                            header.textContent = `${index + 1}. ${currentName}`;
                        });
                        sectionCount = remainingSections.length + 1;
                        
                        commandFeedback.textContent = `Section "${sectionName}" deleted successfully.`;
                        commandFeedback.className = 'command-feedback success';
                        saveTrackerData();
                    } else {
                        commandFeedback.textContent = 'Cannot delete the last section.';
                        commandFeedback.className = 'command-feedback error';
                    }
                } else {
                    commandFeedback.textContent = `Section "${sectionName}" not found.`;
                    commandFeedback.className = 'command-feedback error';
                }
            } else if (command.startsWith('delete line ') || command.startsWith('delete lines ')) {
                const restOfCommand = command.substring(command.indexOf('line') + 5).trim();
                const sections = Array.from(container.querySelectorAll('.section'));
                let deletedCount = 0;
                let notFoundCount = 0;

                // Handle range format (e.g., "2-8")
                if (restOfCommand.includes('-')) {
                    const [start, end] = restOfCommand.split('-').map(num => parseInt(num.trim()));
                    if (isNaN(start) || isNaN(end) || start > end) {
                        commandFeedback.textContent = 'Invalid range format. Use "delete lines start-end" (e.g., "delete lines 2-8").';
                        commandFeedback.className = 'command-feedback error';
                        e.target.value = '';
                        return;
                    }

                    for (let i = start; i <= end; i++) {
                        const rowIds = Array.from(document.querySelectorAll('.row-id'));
                        const rowToDelete = rowIds.find(row => row.textContent.trim() === i.toString());
                        if (rowToDelete) {
                            const row = rowToDelete.parentElement;
                            const section = row.closest('.section');
                            const rowsContainer = section.querySelector('.section-rows');
                            if (rowsContainer.children.length > 1) {
                                rowsContainer.removeChild(row);
                                deletedCount++;
                            } else {
                                notFoundCount++;
                            }
                        } else {
                            notFoundCount++;
                        }
                    }
                } else {
                    // Handle comma-separated format
                    const lineNumbers = restOfCommand.split(',').map(num => parseInt(num.trim()));
                    if (lineNumbers.some(isNaN)) {
                        commandFeedback.textContent = 'Invalid line numbers. Use "delete line 2,3,6" or "delete lines 2,3,6".';
                        commandFeedback.className = 'command-feedback error';
                        e.target.value = '';
                        return;
                    }

                    lineNumbers.forEach(lineNumber => {
                        const rowIds = Array.from(document.querySelectorAll('.row-id'));
                        const rowToDelete = rowIds.find(row => row.textContent.trim() === lineNumber.toString());
                        if (rowToDelete) {
                            const row = rowToDelete.parentElement;
                            const section = row.closest('.section');
                            const rowsContainer = section.querySelector('.section-rows');
                            if (rowsContainer.children.length > 1) {
                                rowsContainer.removeChild(row);
                                deletedCount++;
                            } else {
                                notFoundCount++;
                            }
                        } else {
                            notFoundCount++;
                        }
                    });
                }

                if (deletedCount > 0) {
                    commandFeedback.textContent = `Successfully deleted ${deletedCount} line${deletedCount > 1 ? 's' : ''}.`;
                    if (notFoundCount > 0) {
                        commandFeedback.textContent += ` ${notFoundCount} line${notFoundCount > 1 ? 's' : ''} not found.`;
                    }
                    commandFeedback.className = 'command-feedback success';
                    saveTrackerData();
                } else {
                    commandFeedback.textContent = 'No lines were deleted.';
                    commandFeedback.className = 'command-feedback error';
                }
            } else {
                commandFeedback.textContent = 'Invalid command. Use:\n' +
                    '- "create section" or "create section [name]" or "create section "[name]"" to create a section\n' +
                    '- "delete section [name]" or "delete section "[name]"" to delete a section\n' +
                    '- "delete line 2,3,6" or "delete lines 2,3,6" to delete specific lines\n' +
                    '- "delete lines 2-8" to delete a range of lines\n' +
                    '- "fold line [number]" to fold a line\n' +
                    '- "unfold line [number]" to unfold a line';
                commandFeedback.className = 'command-feedback error';
            }
            e.target.value = '';
        }
    }

    // Load saved data on page load
    loadTrackerData();

    // If no saved data, create initial section with one row
    if (container.children.length === 0) {
        container.appendChild(createSection(1));
    }

    // Add event listeners for content changes
    document.addEventListener('keydown', (e) => {
        if (e.target.classList.contains('arrow-block')) {
            handleTab(e);
            handleEnter(e);
            handleBackspace(e);
        }
    });

    // Save data when content is edited
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('arrow-block') || e.target.classList.contains('section-header')) {
            saveTrackerData();
        }
    });

    // Add event listener for command input
    commandInput.addEventListener('keydown', handleCommandInput);
}); 