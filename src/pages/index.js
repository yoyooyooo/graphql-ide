// import '../graphiql-overide.less';
// import '../graphiql.less';
import Box from '@/components/Box';
import extraSchema from '@/utils/extraSchema';
import { IconButton, Paper, Tab, Tabs } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import CloseIcon from '@material-ui/icons/Close';
import { ApolloLink, execute, Observable } from 'apollo-link';
import { onError } from 'apollo-link-error';
import { HttpLink } from 'apollo-link-http';
import { useSelector } from 'dva';
import GraphiQL from 'graphiql';
import Explorer from 'graphiql-explorer';
import 'graphiql/graphiql.css';
import { extendSchema } from 'graphql';
import { graphqlLodash } from 'graphql-lodash';
import { Source } from 'graphql/language';
import { parse } from 'graphql/language/parser';
import { print } from 'graphql/language/printer';
import { buildClientSchema, getIntrospectionQuery } from 'graphql/utilities';
import get from 'lodash/get';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createGlobalStyle } from 'styled-components';
import prettier from 'prettier/standalone';
import parserGraphql from 'prettier/parser-graphql';

function formatGql(query) {
  return prettier.format(query, {
    parser: 'graphql',
    plugins: [parserGraphql],
  });
}

const useStyles = makeStyles({
  tabRoot: {
    textTransform: 'inherit',
    color: '#ddd !important',
    minWidth: 110,
    paddingLeft: 20,
    paddingRight: 20,
    '&:hover': {
      color: '#000 !important',
    },
    '&:hover $closeIcon': {
      display: 'inline-flex',
    },
  },
  tabSelected: {
    color: '#000 !important',
    display: 'inline-flex',
  },
  closeIcon: { position: 'absolute', right: 2, display: 'none', fontSize: 20 },
  tabTitle: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    width: '100%',
    maxWidth: 130,
  },
});

// function graphQLFetcher(graphQLParams) {
//   return fetch(URL, {
//     method: 'post',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(graphQLParams),
//   }).then(response => response.json());
// }

const Css = createGlobalStyle`
  .graphiql-container>.graphiql-container>.historyPaneWrap {
    display: ${p => (p.historyPaneOpen ? 'block' : 'none')} !important;
  }
`;

export default props => {
  const isClickExplore = useRef(null);
  const isClickTab = useRef(null);
  const previousSession = useRef(null);
  const classes = useStyles();
  const [sessions, setSessions] = useState(
    () =>
      JSON.parse(window.localStorage.getItem('sessions')) || [
        {
          title: 'New Title',
          active: true,
          query: window.localStorage.getItem('graphiql:query') || '',
        },
      ],
  );
  const [query, setQuery] = useState(() => {
    const activeTab = sessions.find(s => s.active);
    return (activeTab && activeTab.query) || window.localStorage.getItem('graphiql:query') || '';
  });
  const uri = useSelector(state => state.global.graphqlUri);
  const graphiql = useRef(null);
  const [variables, setVariables] = useState('');
  const [tabIndex, setTabIndex] = React.useState(() => {
    const activeIndex = sessions.findIndex(a => a.active);
    return activeIndex === -1 ? 0 : activeIndex;
  });
  const [schema, setSchema] = useState(null);
  const [explorerIsOpen, setExplorerIsOpen] = useState(true);
  const [historyPaneOpen, setHistoryPaneOpen] = useState(false);

  const prettierQuery = query => {
    setQuery(formatGql(query));
  };

  const setClick = useCallback(e => {
    if (e.target.tagName === 'SPAN') {
      isClickExplore.current = true;
    }
  }, []);

  useEffect(() => {
    const node = document.querySelector('.graphiql-explorer-root');
    if (node) {
      node.addEventListener('click', setClick);
    }
    return () => {
      node && node.removeEventListener('click', setClick);
    };
  }, [schema]);

  const httpLink = useMemo(
    () => uri && new HttpLink({ uri, credentials: 'same-origin' /* , headers: {}  */ }),
    [uri],
  );

  const finalLink = useMemo(() => {
    return ApolloLink.from([
      onError(({ graphQLErrors, networkError, operation, forward, response }) => {
        if (networkError) {
          // console.log(`[Network error]: ${networkError}`);
          // setSchema(null);
        }
      }),
      ...(httpLink ? [httpLink] : []),
    ]);
  }, [httpLink]);

  // tabs
  useEffect(() => {
    window.localStorage.setItem('sessions', JSON.stringify(sessions));
    previousSession.current = sessions;
  }, [sessions]);
  useEffect(() => {
    const activeTab = previousSession.current.find((s, i) => i === tabIndex);
    setTimeout(() => {
      setQuery((activeTab && activeTab.query) || '');
      graphiql.current && activeTab && activeTab.query && graphiql.current.handleRunQuery();
    }, 0);
  }, [tabIndex]);

  const fetcher = useCallback(
    ({ query, operationName, variables = {} }) => {
      const { query: query2, transform } = graphqlLodash(query, operationName);
      if (!finalLink) return [];
      console.log(isClickTab.current);
      if (isClickTab.current !== null) {
        const result = previousSession.current[isClickTab.current].result;
        isClickTab.current = null;
        if (result) {
          return new Observable(observer => {
            observer.next(result);
            observer.complete();
          });
        }
      }
      const result = execute(finalLink, { query: parse(query2), variables, context: {} });
      const ret = result.map(res => {
        const newResult = { ...res, data: transform(res.data) };
        !query.includes('IntrospectionQuery') &&
          setSessions(p => p.map((a, i) => (tabIndex === i ? { ...a, result: newResult } : a)));
        return newResult;
      });
      isClickTab.current = null;
      return ret;
      // if (query.includes('IntrospectionQuery')) {
      //   return ret;
      // } else {
      //   return new Observable(observer => {
      //     const handle = ret.subscribe({
      //       next: observer.next.bind(observer),
      //       error: observer.error.bind(observer),
      //       complete: observer.complete.bind(observer),
      //     });
      //     return () => {
      //       handle.unsubscribe();
      //     };
      //   });
      // }
    },
    [finalLink, tabIndex],
  );

  // get schema
  useEffect(() => {
    // const editor = graphiql.current && graphiql.current.getQueryEditor();
    // console.log(editor);
    httpLink &&
      fetcher({
        query: getIntrospectionQuery(),
      }).forEach(result => {
        setSchema(
          extendSchema(buildClientSchema(result.data), parse(new Source(extraSchema, 'mySchema'))),
        );
      });
  }, [httpLink]); // eslint-disable-line

  const closeHistoryPane = useCallback(() => {
    setHistoryPaneOpen(false);
  }, []);

  useEffect(() => {
    if (!uri) return;
    const closeNode = document.querySelector(
      '#root > div > div.graphiql-container > div.historyPaneWrap > section > div > div.doc-explorer-rhs',
    );
    closeNode && closeNode.addEventListener('click', closeHistoryPane);
    return () => {
      closeNode && closeNode.removeEventListener('click', closeHistoryPane);
    };
  }, [uri, closeHistoryPane]);

  const onTabChange = (e, i) => {
    setTabIndex(i);
    const newSessions = sessions.map((s, index) =>
      i === index ? { ...s, active: true } : { ...s, active: false },
    );
    setSessions(newSessions);
    // window.localStorage.setItem('sessions', JSON.stringify(newSessions));
  };

  const addTab = () => {
    const newSessions = [
      ...sessions.map(s => ({ ...s, active: false })),
      { title: 'New Title', query: '', active: true },
    ];
    setTabIndex(newSessions.length - 1);
    setSessions(newSessions);
    // window.localStorage.setItem('sessions', JSON.stringify(newSessions));
  };

  const closeTab = i => {
    const newSessions = sessions.filter((s, index) => index !== i);
    if (newSessions.length === 0) {
      const newSessions = [{ title: 'New Title', query: '', active: true }];
      setSessions(newSessions);
      setTabIndex(0);
      setQuery('');
      // window.localStorage.setItem('sessions', JSON.stringify(newSessions));
      return;
    }
    setSessions(newSessions);
    setTabIndex(p => p - 1);
    // window.localStorage.setItem('sessions', JSON.stringify(newSessions));
  };

  const clearDefaultQueryState = query => {
    let title;
    try {
      const ast = parse(query);
      title =
        get(ast, 'definitions.0.name.value') ||
        get(ast, 'definitions.0.selectionSet.selections.0.name.value') ||
        '';
    } catch (error) {}
    const newSessions = sessions.map((s, index) =>
      tabIndex === index ? { ...s, query, title } : s,
    );
    setQuery(isClickExplore.current ? formatGql(query) : query);
    setVariables(undefined);
    setSessions(newSessions);
    // window.localStorage.setItem('sessions', JSON.stringify(newSessions));

    isClickExplore.current = false;
  };
  const onToggleExplorer = () => {
    setExplorerIsOpen(p => !p);
  };
  return (
    <>
      <Css historyPaneOpen={historyPaneOpen} />
      {uri && httpLink ? (
        <div className="graphiql-container">
          <Explorer
            query={query || ''}
            schema={schema}
            onEdit={clearDefaultQueryState}
            explorerIsOpen={explorerIsOpen}
            onToggleExplorer={onToggleExplorer}
            onRunOperation={operationName => graphiql.handleRunQuery(operationName)}
          />
          <Paper square style={{ width: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Box display="flex" alignItems="center">
              <Tabs
                variant="scrollable"
                scrollButtons="auto"
                value={tabIndex}
                onChange={onTabChange}
                indicatorColor="primary"
                textColor="primary"
              >
                {sessions.map(({ title, query }, i) => (
                  <Tab
                    key={i}
                    onClick={e => {
                      isClickTab.current = i;
                    }}
                    classes={{ root: classes.tabRoot, selected: classes.tabSelected }}
                    label={
                      <Box flexCenter>
                        <div className={classes.tabTitle}>{title || 'New Title'}</div>
                        <CloseIcon
                          className={classes.closeIcon}
                          onClick={e => {
                            e.stopPropagation();
                            closeTab(i);
                          }}
                        />
                      </Box>
                    }
                  />
                ))}
              </Tabs>
              <IconButton onClick={addTab}>
                <AddIcon />
              </IconButton>
            </Box>
            <GraphiQL
              query={query}
              schema={schema}
              fetcher={fetcher}
              onEditQuery={clearDefaultQueryState}
              onEditVariables={() => setVariables()}
              variables={variables}
              ref={graphiql}
            >
              <GraphiQL.Toolbar>
                <GraphiQL.Button onClick={() => prettierQuery(query)} label="Prettify" />
                {/* <GraphiQL.Button onClick={() => setHistoryPaneOpen(p => !p)} label="History" /> */}
                <GraphiQL.Button
                  onClick={onToggleExplorer}
                  label="Explorer"
                  title="Toggle Explorer"
                />
              </GraphiQL.Toolbar>
            </GraphiQL>
          </Paper>
        </div>
      ) : (
        <Box>click bottom right button to set graphql url</Box>
      )}
    </>
  );
};
