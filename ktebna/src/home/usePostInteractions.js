import { useState } from "react";

export const usePostInteractions = (user) => {
    const [openLogin, setOpenLogin] = useState(false);
    const [selectedBook, setSelectedBook] = useState(null);
    const [openDrawer, setOpenDrawer] = useState(false);
    const [openChatDrawer, setOpenChatDrawer] = useState(false);
    const [chatDetails, setChatDetails] = useState({
        sellerId: null,
        sellerName: null,
        buyerName: null,
        bookName: null,
    });

    const handleOpenDrawer = (book) => {
        setSelectedBook(book);
        setOpenDrawer(true);
    };

    const handleCloseDrawer = () => {
        setOpenDrawer(false);
        setSelectedBook(null);
    };

    const handleOpenChatDrawer = (book) => {
        if (!user) {
            setOpenLogin(true);
            return;
        }

        setChatDetails({
            sellerId: book.user?.id,
            sellerName: book.user?.name,
            buyerName: user.name,
            bookName: book.bookName,
        });
        setOpenChatDrawer(true);
    };

    const handleCloseChatDrawer = () => {
        setOpenChatDrawer(false);
        setChatDetails({
            sellerId: null,
            sellerName: null,
            buyerName: null,
            bookName: null,
        });
    };

    return {
        openLogin,
        setOpenLogin,
        selectedBook,
        openDrawer,
        openChatDrawer,
        chatDetails,
        handleOpenDrawer,
        handleCloseDrawer,
        handleOpenChatDrawer,
        handleCloseChatDrawer,
    };
};
