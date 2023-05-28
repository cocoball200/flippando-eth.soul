// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GameNFT is ERC721URIStorage, Ownable {
    uint256 private tokenIdCounter;
    uint256 private constant FLIP_PER_SPONSORED_GAME = 4;

    struct Game {
        address creator;
        string metadata;
        GameType gameType;
        uint256 flipTokensLocked;
    }

    enum GameType { sponsored }

    mapping(uint256 => Game) private games;
    mapping(address => uint256[]) private creatorGames;
    mapping(address => mapping(uint256 => string)) private sponsoredGameStatus;
    mapping(address => uint256[]) private normalGames;

    IERC20 private flipToken; // FLIP ERC20 Token address

    constructor(address flipTokenAddress) ERC721("GameNFT", "GNFT") {
        flipToken = IERC20(flipTokenAddress);
    }

    function createGame(string memory metadata, GameType gameType) external {
        if (gameType == GameType.Sponsored) {
            require(flipToken.balanceOf(msg.sender) >= FLIP_PER_SPONSORED_GAME, "Insufficient FLIP tokens");

            uint256 gameId = tokenIdCounter;
            tokenIdCounter++;

            _safeMint(msg.sender, gameId);
            _setTokenURI(gameId, metadata);

            games[gameId] = Game({
                creator: msg.sender,
                metadata: metadata,
                gameType: gameType,
                flipTokensLocked: FLIP_PER_SPONSORED_GAME
            });

            creatorGames[msg.sender].push(gameId);
        } else {
            uint256 gameId = tokenIdCounter;
            tokenIdCounter++;

            _safeMint(msg.sender, gameId);
            _setTokenURI(gameId, metadata);

            games[gameId] = Game({
                creator: msg.sender,
                metadata: metadata,
                gameType: gameType,
                flipTokensLocked: 1
            });

            normalGames[msg.sender].push(gameId);
        }
    }

    function setGameStatus(uint256 gameId, address user, string memory status) external {
        require(_exists(gameId), "Game does not exist");
        require(ownerOf(gameId) == msg.sender, "Caller is not the game owner");
        require(bytes(status).length > 0, "Invalid status");

        if (games[gameId].gameType == GameType.Sponsored) {
            require(keccak256(bytes(status)) == keccak256("started"), "Invalid status for sponsored game");

            if (sponsoredGameStatus[user][gameId] != "") {
                require(keccak256(bytes(sponsoredGameStatus[user][gameId])) != keccak256("started"), "Sponsored game already started");
            }

            sponsoredGameStatus[user][gameId] = "started";
        } else if (games[gameId].gameType == GameType.Normal) {
            require(keccak256(bytes(status)) != keccak256("started"), "Invalid status for normal game");

            // Update the status for the normal game
            // ...
        } else {
            revert("Invalid game type");
        }
    }

    function releaseGame(uint256 gameId) external {
        require(_exists(gameId), "Game does not exist");
        require(games[gameId].gameType == GameType.Sponsored, "Game is not sponsored");

        address gameOwner = ownerOf(gameId);

        if (sponsoredGameStatus[gameOwner][gameId] == "started") {
            sponsoredGameStatus[gameOwner][gameId] = "";
        }
    }

    function getSponsoredGameStatus(address user, uint256 gameId) external view returns (string memory) {
        require(_exists(gameId), "Game does not exist");
        require(games[gameId].gameType == GameType.Sponsored, "Game is not a sponsored game");

        return sponsoredGameStatus[user][gameId];
    }

    function getNormalGameStatus(address user, uint256 gameId) external view returns (string memory) {
        require(_exists(gameId), "Game does not exist");
        require(games[gameId].gameType == GameType.Normal, "Game is not a normal game");

        // Return the status for the normal game
        // ...
    }

    function getCreatorSponsoredGames(address creator) external view returns (uint256[] memory) {
        return creatorGames[creator];
    }

    function getCreatorNormalGames(address creator) external view returns (uint256[] memory) {
        return normalGames[creator];
    }

    function getGameMetadata(uint256 gameId) external view returns (string memory) {
        require(_exists(gameId), "Game does not exist");
        return games[gameId].metadata;
    }
}
