import { Box, Button, Popover, TextField, Fab, Zoom, Fade } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import SettingsIcon from '@material-ui/icons/Settings';
import { useDispatch } from 'dva';
import { bindPopover, bindTrigger } from 'material-ui-popup-state';
import { usePopupState } from 'material-ui-popup-state/hooks';
import React, { useState } from 'react';

const useStyles = makeStyles(theme => ({
  paper: {
    minHeight: 200,
  },
  fab: {
    position: 'absolute',
    bottom: theme.spacing(2),
    right: theme.spacing(2),
  },
}));

const Content = ({ popupState }) => {
  const dispatch = useDispatch();
  const [uri, setUri] = useState(window.localStorage.getItem('uri') || '');
  return (
    <Box p={2}>
      <TextField
        label="Graphql Url"
        placeholder="please input graphql url"
        style={{ width: 500 }}
        value={uri}
        onChange={e => setUri(e.target.value)}
      />
      <Box position="absolute" right={10} bottom={10}>
        <Button
          variant="contained"
          color="primary"
          style={{ marginLeft: 10 }}
          onClick={e => {
            dispatch({ type: 'global/save', payload: { graphqlUri: uri } });
            window.localStorage.setItem('uri', uri);
            popupState.close();
          }}
        >
          Save
        </Button>
      </Box>
    </Box>
  );
};

function BasicLayout(props) {
  const classes = useStyles();
  const popupState = usePopupState({ variant: 'popover', popupId: 'menu1' });

  return (
    <>
      {props.children}
      <Zoom in={!popupState.isOpen}>
        <Fab color="primary" aria-label="add" className={classes.fab} {...bindTrigger(popupState)}>
          <SettingsIcon />
        </Fab>
      </Zoom>
      <Popover
        {...bindPopover(popupState)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        classes={{ paper: classes.paper }}
      >
        <Content popupState={popupState} />
      </Popover>
    </>
  );
}

export default BasicLayout;
