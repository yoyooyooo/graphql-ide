import { style } from '@material-ui/system';

export default style({
  prop: 'flexCenter',
  cssProperty: false,
  transform: flexCenter =>
    flexCenter
      ? {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }
      : {},
});
