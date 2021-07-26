// Adapted from example at https://material-ui.com/components/popover/
import React, { ReactElement } from "react";
import { makeStyles, createStyles, Theme } from "@material-ui/core/styles";
import { IconButton, Popover as MaterialUIPopover } from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import CancelIcon from "@material-ui/icons/Cancel";
import "./styles/Popover.css";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    typography: {
      padding: theme.spacing(2),
      fontSize: 13,
      fontFamily: "Montserrat",
      fontWeight: 500,
    },
  })
);

type PopoverProps = {
  button: JSX.Element;
  buttonStyles?: React.CSSProperties;
  tooltip: string;
  innerContent: JSX.Element;
};

export default function Popover({
  button,
  buttonStyles,
  tooltip,
  innerContent,
}: PopoverProps): ReactElement {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = React.useState<HTMLDivElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "simple-popover" : undefined;

  return (
    <>
      <div
        className="popover-button-container"
        style={buttonStyles}
        aria-describedby={id}
        onClick={handleClick}
        title={tooltip}
      >
        {button}
      </div>
      <MaterialUIPopover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <IconButton
          className="close-button"
          onClick={handleClose}
          style={{ padding: "0" }}
          size="small"
        >
          <CancelIcon htmlColor="#ff6666" fontSize="small" />
        </IconButton>
        <Typography style={{}} className={classes.typography}>
          {innerContent}
        </Typography>
      </MaterialUIPopover>
    </>
  );
}
