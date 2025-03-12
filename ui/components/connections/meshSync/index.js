import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router'; // Add this import
import { Tooltip, Grid, FormControl, MenuItem, CustomTooltip, Table } from '@layer5/sistent';
import { formatDate } from '../../DataFormatter';

import { useNotification } from '../../../utils/hooks/useNotification';
import { EVENT_TYPES } from '../../../lib/event-types';
import {
  CustomColumnVisibilityControl,
  ResponsiveDataTable,
  SearchBar,
  UniversalFilter,
  TableCell,
  TableRow,
} from '@layer5/sistent';
import { MeshSyncDataFormatter } from '../metadata';
import { getK8sClusterIdsFromCtxId } from '../../../utils/multi-ctx';
import { DefaultTableCell, SortableTableCell } from '../common';
import { ToolWrapper } from '@/assets/styles/general/tool.styles';
import {
  JsonParse,
  camelcaseToSnakecase,
  getColumnValue,
  getVisibilityColums,
} from '../../../utils/utils';
import RegisterConnectionModal from './RegisterConnectionModal';
import { CONNECTION_STATES, MESHSYNC_STATES } from '../../../utils/Enum';
import { updateVisibleColumns } from '../../../utils/responsive-column';
import { useWindowDimensions } from '../../../utils/dimension';
import { FormatId } from '../../DataFormatter';
import {
  useGetMeshSyncResourceKindsQuery,
  useGetMeshSyncResourcesQuery,
} from '@/rtk-query/meshsync';
import { ConnectionStateChip } from '../ConnectionChip';
import { ContentContainer, ConnectionStyledSelect, InnerTableContainer } from '../styles';

const ACTION_TYPES = {
  FETCH_MESHSYNC_RESOURCES: {
    name: 'FETCH_MESHSYNC_RESOURCES',
    error_msg: 'Failed to fetch meshsync resources',
  },
};

export default function MeshSyncTable(props) {
  // Destructure resourceId from props
  const { updateProgress, selectedK8sContexts, k8sconfig, resourceId } = props;
  const router = useRouter(); // Initialize router
  const callbackRef = useRef();

  const isUserAction = useRef(true);
  const resourceRowRef = useRef(null);
  const [openRegistrationModal, setRegistrationModal] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState(null);
  const [rowsExpanded, setRowsExpanded] = useState([]);
  const [selectedKind, setSelectedKind] = useState('');

  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({ kind: 'All' });
  const [registerConnection, setRegisterConnection] = useState({
    metadata: {},
    kind: '',
  });
  const { width } = useWindowDimensions();

  const { notify } = useNotification();

  const handleRegistrationModalClose = () => {
    setRegistrationModal(false);
  };

  const {
    data: meshSyncData,
    isError: isError,
    error: meshSyncError,
  } = useGetMeshSyncResourcesQuery({
    page: page,
    pagesize: pageSize,
    search: search,
    order: sortOrder,
    kind: selectedKind,
    clusterIds: JSON.stringify(getK8sClusterIdsFromCtxId(selectedK8sContexts, k8sconfig)),
  });
  if (isError) {
    notify({
      message: 'Error fetching MeshSync Resources',
      event_type: EVENT_TYPES.ERROR,
      details: meshSyncError?.data,
    });
  }
  const { data: clusterSummary } = useGetMeshSyncResourceKindsQuery({
    page: page,
    pagesize: 'all',
    search: search,
    order: sortOrder,
    clusterIds: getK8sClusterIdsFromCtxId(selectedK8sContexts, k8sconfig),
  });
  const availableKinds = (clusterSummary?.kinds || []).map((kind) => kind.Kind);

  const meshSyncResources = meshSyncData?.resources || [];

  let colViews = [
    ['metadata.name', 'xs'],
    ['apiVersion', 'na'],
    ['kind', 'm'],
    ['model', 'm'],
    ['cluster_id', 'na'],
    ['pattern_resources', 'na'],
    ['metadata.creationTimestamp', 'l'],
    ['status', 'xs'],
    ['metadata', 'na'],
  ];

  const columns = [
    {
      name: 'metadata.name',
      label: 'Name',
      options: {
        customHeadRender: function CustomHead({ ...column }) {
          return <DefaultTableCell columnData={column} />;
        },
        customBodyRender: (value) => {
          const maxCharLength = 30;
          const shouldTruncate = value?.length > maxCharLength;

          return (
            <Tooltip title={value} placement="top">
              <div
                style={{
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: shouldTruncate ? 'ellipsis' : 'none',
                }}
              >
                {shouldTruncate ? `${value.slice(0, maxCharLength)}...` : value}
              </div>
            </Tooltip>
          );
        },
      },
    },
    {
      name: 'apiVersion',
      label: 'API version',
      options: {
        sort: true,
        sortThirdClickReset: true,
        customHeadRender: function CustomHead({ index, ...column }, sortColumn, columnMeta) {
          return (
            <SortableTableCell
              index={index}
              columnData={column}
              columnMeta={columnMeta}
              onSort={() => sortColumn(index)}
            />
          );
        },
      },
    },
    {
      name: 'kind',
      label: 'Kind',
      options: {
        sort: true,
        sortThirdClickReset: true,
        customHeadRender: function CustomHead({ index, ...column }, sortColumn, columnMeta) {
          return (
            <SortableTableCell
              index={index}
              columnData={column}
              columnMeta={columnMeta}
              onSort={() => sortColumn(index)}
            />
          );
        },
      },
    },
    {
      name: 'model',
      label: 'Model',
      options: {
        sort: true,
        sortThirdClickReset: true,
        customHeadRender: function CustomHead({ index, ...column }, sortColumn, columnMeta) {
          return (
            <SortableTableCell
              index={index}
              columnData={column}
              columnMeta={columnMeta}
              onSort={() => sortColumn(index)}
            />
          );
        },
      },
    },
    {
      name: 'cluster_id',
      label: 'Cluster ID',
      options: {
        sort: true,
        sortThirdClickReset: true,
        customHeadRender: function CustomHead({ index, ...column }, sortColumn, columnMeta) {
          return (
            <SortableTableCell
              index={index}
              columnData={column}
              columnMeta={columnMeta}
              onSort={() => sortColumn(index)}
            />
          );
        },
        customBodyRender: (value) => <FormatId id={value} />,
      },
    },
    {
      name: 'pattern_resources',
      label: 'Pattern resources',
      options: {
        sort: true,
        sortThirdClickReset: true,
        display: false,
        customHeadRender: function CustomHead({ index, ...column }, sortColumn, columnMeta) {
          return (
            <SortableTableCell
              index={index}
              columnData={column}
              columnMeta={columnMeta}
              onSort={() => sortColumn(index)}
            />
          );
        },
        customBodyRender: (value) => {
          const maxCharLength = 30;
          const shouldTruncate = value?.length > maxCharLength;

          return (
            <Tooltip title={value} placement="top">
              <div
                style={{
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: shouldTruncate ? 'ellipsis' : 'none',
                }}
              >
                {shouldTruncate ? `${value.slice(0, maxCharLength)}...` : value}
              </div>
            </Tooltip>
          );
        },
      },
    },
    {
      name: 'metadata.creationTimestamp',
      label: 'Discovered At',
      options: {
        customHeadRender: function CustomHead({ ...column }) {
          return <DefaultTableCell columnData={column} />;
        },
        customBodyRender: function CustomBody(value) {
          return <FormattedTime date={value} />;
        },
      },
    },
    {
      name: 'status',
      label: 'Status',
      options: {
        sort: false,
        customHeadRender: function CustomHead({ ...column }) {
          return <DefaultTableCell columnData={column} />;
        },
        customBodyRender: function CustomBody(value, tableMeta) {
          const componentMetadata = getColumnValue(
            tableMeta.rowData,
            'component_metadata',
            columns,
          );
          const DISCOVERED = {
            DISCOVERED: MESHSYNC_STATES.DISCOVERED,
          };
          const meshSyncStates =
            componentMetadata?.capabilities?.connection === true ? MESHSYNC_STATES : DISCOVERED;
          const disabled =
            componentMetadata?.capabilities?.connection === true &&
            value !== CONNECTION_STATES.REGISTERED
              ? false
              : true;
          return (
            <FormControl>
              <ConnectionStyledSelect
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                defaultValue={MESHSYNC_STATES.DISCOVERED}
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  const clickedValue = e.target.value;
                  if (clickedValue !== MESHSYNC_STATES.DISCOVERED && clickedValue !== value) {
                    setRegistrationModal((open) => !open);
                  }
                }}
                onChange={() => {
                  callbackRef?.current?.(tableMeta);
                  setRegisterConnection({
                    capabilities: componentMetadata?.capabilities,
                    metadata: JsonParse(componentMetadata.metadata),
                    resourceID: tableMeta.rowData[tableMeta.rowData.length - 1],
                  });
                }}
                disableUnderline
                MenuProps={{
                  anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'left',
                  },
                  transformOrigin: {
                    vertical: 'top',
                    horizontal: 'left',
                  },
                  getContentAnchorEl: null,
                  MenuListProps: { disablePadding: true },
                  PaperProps: { square: true },
                }}
              >
                {Object.keys(meshSyncStates).map((s) => (
                  <MenuItem
                    disabled={
                      meshSyncStates[s] === value ||
                      meshSyncStates[s] === CONNECTION_STATES.REGISTERED
                        ? true
                        : false
                    }
                    value={meshSyncStates[s]}
                    key={meshSyncStates[s]}
                    style={{ padding: '0' }}
                  >
                    <ConnectionStateChip status={meshSyncStates[s]} />
                  </MenuItem>
                ))}
              </ConnectionStyledSelect>
            </FormControl>
          );
        },
      },
    },
    {
      name: 'component_metadata',
      label: 'Component Metadata',
      options: {
        display: false,
      },
    },
    {
      name: 'id',
      label: 'Resource ID',
      options: {
        display: false,
      },
    },
    {
      name: 'metadata',
      label: 'Metadata',
      options: {
        display: false,
      },
    },
  ];

  const options = {
    filter: false,
    viewColumns: false,
    search: false,
    responsive: 'standard',
    // resizableColumns: true,
    serverSide: true,
    selectableRows: 'none',
    count: meshSyncData?.total_count,
    rowsPerPage: pageSize,
    fixedHeader: true,
    page,
    print: false,
    download: false,
    textLabels: {
      selectedRows: {
        text: 'connection(s) selected',
      },
    },
    enableNestedDataAccess: '.',
    onTableChange: (action, tableState) => {
      const sortInfo = tableState.announceText ? tableState.announceText.split(' : ') : [];
      let order = '';
      const columnName = camelcaseToSnakecase(columns[tableState.activeColumn]?.name);
      if (tableState.activeColumn) {
        order = `${columnName} desc`;
      }
      switch (action) {
        case 'changePage':
          setPage(tableState.page.toString());
          break;
        case 'changeRowsPerPage':
          setPageSize(tableState.rowsPerPage.toString());
          break;
        case 'sort':
          if (sortInfo.length == 2) {
            if (sortInfo[1] === 'ascending') {
              order = `${columnName} asc`;
            } else {
              order = `${columnName} desc`;
            }
          }
          if (order !== sortOrder) {
            setSortOrder(order);
          }
          break;
      }
    },
    expandableRows: true,
    expandableRowsHeader: false,
    expandableRowsOnClick: true,
    rowsExpanded: rowsExpanded,
    isRowExpandable: () => true,
    onRowExpansionChange: (_, allRowsExpanded) => {
      const expandedRows = allRowsExpanded.slice(-1).map((item) => item.index);
      setRowsExpanded(expandedRows);

      // Update URL based on expansion state
      const currentQuery = { ...router.query };

      if (expandedRows.length > 0) {
        const expandedResource = meshSyncResources[expandedRows[0]];
        if (expandedResource) {
          // Preserve existing query parameters and update tab and id
          currentQuery.tab = 'meshsync';
          currentQuery.id = expandedResource.id;
        }
      } else {
        // Remove id parameter while preserving other query parameters including tab
        delete currentQuery.id;
        currentQuery.tab = 'meshsync';
      }


      // Update URL with modified query parameters
      router.push(
        {
          pathname: router.pathname,
          query: currentQuery,
        },
        undefined,
        { shallow: true },
      );

      isUserAction.current = true;
    },
    renderExpandableRow: (rowData, tableMeta) => {
      const colSpan = rowData.length;
      if (!meshSyncResources || !meshSyncResources[tableMeta.rowIndex]) {
        return (
          <TableCell colSpan={colSpan}>
            <div style={{ padding: '20px', textAlign: 'center' }}>Loading resource data...</div>
          </TableCell>
        );
      }

      const resource = meshSyncResources[tableMeta.rowIndex];

      return (
        <TableCell colSpan={colSpan}>
          <InnerTableContainer>
            <Table>

              <TableRow style={{ padding: 0 }}>
                <TableCell style={{ padding: '20px 0', overflowX: 'hidden' }}>
                  <Grid container spacing={1}>
                    <ContentContainer item xs={12} md={12}>
                      <Grid container spacing={1}>
                        <ContentContainer item xs={12} md={12}>
                          <MeshSyncDataFormatter resource={resource} />
                        </ContentContainer>
                      </Grid>
                    </ContentContainer>
                  </Grid>
                </TableCell>
              </TableRow>
            </Table>
          </InnerTableContainer>
        </TableCell>
      );
    },
    rowProps: (rowData, rowIndex) => ({
      ref: meshSyncResources[rowIndex]?.id === resourceId ? resourceRowRef : undefined,
    }),
  };

  const handleError = (action) => (error) => {
    updateProgress({ showProgress: false });
    notify({
      message: `${action.error_msg}: ${error}`,
      event_type: EVENT_TYPES.ERROR,
      details: error.toString(),
    });
  };

  useEffect(() => {
    if (meshSyncError) {
      handleError(ACTION_TYPES.FETCH_MESHSYNC_RESOURCES)(meshSyncError);
    }
  }, [meshSyncError]);

  const filters = {
    kind: {
      name: 'Kind',
      options: [
        ...availableKinds.map((kind) => ({
          value: kind,
          label: kind,
        })),
      ],
    },
  };

  const handleApplyFilter = () => {
    const columnName = Object.keys(selectedFilters)[0];
    const columnValue = selectedFilters[columnName];

    // Check if the selected value is "All"
    const newSelectedKind = columnValue === 'All' ? '' : columnValue;
    setSelectedKind(newSelectedKind);
  };

  const [tableCols, updateCols] = useState(columns);

  const [columnVisibility, setColumnVisibility] = useState(() => {
    let showCols = updateVisibleColumns(colViews, width);
    // Initialize column visibility based on the original columns' visibility
    const initialVisibility = {};
    columns.forEach((col) => {
      initialVisibility[col.name] = showCols[col.name];
    });
    return initialVisibility;
  });

  useEffect(() => {
    updateCols(columns);
  }, []);

  // Effect to handle ID-based row expansion
  useEffect(() => {
    if (resourceId && meshSyncResources?.length > 0) {
      isUserAction.current = false;

      const resourceIndex = meshSyncResources.findIndex((resource) => resource.id === resourceId);
      
      if (resourceIndex !== -1) {
        // Set the page if needed
        const resourcePage = Math.floor(resourceIndex / pageSize);
        if (resourcePage !== page) {
          setPage(resourcePage);
        }
        
        // Expand the row
        setRowsExpanded([resourceIndex]);
        
        // Scroll into view after a delay to ensure the row is rendered
        setTimeout(() => {
          if (resourceRowRef.current) {
            resourceRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      }
    }
  }, [resourceId, meshSyncResources, pageSize]);

  // Add effect to handle URL updates when rows are expanded/collapsed
  useEffect(() => {
    if (isUserAction.current && meshSyncResources) {
      const currentQuery = { ...router.query };
      currentQuery.tab = 'meshsync'; // Always preserve meshsync tab
      
      if (rowsExpanded.length > 0) {
        const expandedResource = meshSyncResources[rowsExpanded[0]];
        if (expandedResource) {
          currentQuery.id = expandedResource.id;
        }
      } else {
        delete currentQuery.id;
      }

      router.push(
        {
          pathname: router.pathname,
          query: currentQuery,
        },
        undefined,
        { shallow: true }
      );
    }
  }, [rowsExpanded]);

  return (
    <>
      <ToolWrapper style={{ marginBottom: '5px', marginTop: '-30px' }}>
        <div
          style={{
            display: 'flex',
            borderRadius: '0.5rem 0.5rem 0 0',
            width: '100%',
            justifyContent: 'end',
          }}
        >
          <SearchBar
            onSearch={(value) => {
              setSearch(value);
            }}
            expanded={isSearchExpanded}
            setExpanded={setIsSearchExpanded}
            placeholder="Search Connections..."
          />

          <UniversalFilter
            id="ref"
            filters={filters}
            selectedFilters={selectedFilters}
            setSelectedFilters={setSelectedFilters}
            handleApplyFilter={handleApplyFilter}
          />

          <CustomColumnVisibilityControl
            id="ref"
            columns={getVisibilityColums(columns)}
            customToolsProps={{ columnVisibility, setColumnVisibility }}
          />
        </div>
      </ToolWrapper>

      <ResponsiveDataTable
        data={meshSyncResources}
        columns={columns}
        options={options}
        tableCols={tableCols}
        updateCols={updateCols}
        columnVisibility={columnVisibility}
      />

      <RegisterConnectionModal
        handleRegistrationModalClose={handleRegistrationModalClose}
        openRegistrationModal={openRegistrationModal}
        connectionData={registerConnection}
      />
    </>
  );
}
