import {
  borders,
  breakpoints,
  compose,
  display,
  flexbox,
  palette,
  positions,
  shadows,
  sizing,
  spacing,
  typography,
} from '@material-ui/system';
import styled from 'styled-components';
import flexCenter from './flexCenter';
import variant from './variant';

const Box = styled.div`
  ${breakpoints(
    compose(
      typography,
      palette,
      borders,
      display,
      flexbox,
      positions,
      shadows,
      sizing,
      spacing,
      variant,
      flexCenter,
    ),
  )}
`;

export default Box;
