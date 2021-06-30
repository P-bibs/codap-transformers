// Adapted from example at https://material-ui.com/components/popover/
import React, { ReactElement } from "react";
import { makeStyles, createStyles, Theme } from "@material-ui/core/styles";
import { Popover as MaterialUIPopover } from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";

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
  icon: JSX.Element;
  tooltip: string;
  innerContent: JSX.Element;
};

export default function Popover({
  icon,
  tooltip,
  innerContent,
}: PopoverProps): ReactElement {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "simple-popover" : undefined;

  return (
    <div style={{ display: "inline", marginLeft: "5px" }}>
      <IconButton
        style={{ padding: "0" }}
        size="small"
        aria-describedby={id}
        onClick={handleClick}
        title={tooltip}
      >
        {icon}
      </IconButton>
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
        <Typography className={classes.typography}>{innerContent}</Typography>
      </MaterialUIPopover>
    </div>
  );
}
