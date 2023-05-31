// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
//import "@openzeppelin/contracts/access/Ownable.sol";
import "./FLIP.sol";
import "./Flippando.sol";

contract FlippandoGameMaster is ERC721URIStorage {
    uint256 private tokenIdCounter;
    uint256 private constant FLIP_PER_SPONSORED_GAME = 4;

    struct Game {
        address creator;
        address player;
        string metadata;
        string gameTileType; 
        string gameStatus;
        GameType gameType;
        uint256 flipTokensLocked;
    }

    enum GameType { Sponsored, Normal }
    address public owner;

    mapping(uint256 => Game) private games;
    mapping(address => uint256[]) private sponsoredGames;
    mapping(address => uint256[]) private normalGames;

    FLIP private flipToken; // FLIP ERC20 Token address
    Flippando private flippando; // Flippando instance to call initialize_game

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the contract owner can call this function");
        _;
    }

    function changeOwner(address newOwner) external onlyOwner {
        owner = newOwner;
        // the owner of this contract is Flippando (after initialization)
        // so we set the address of the contract to it
        flippando = Flippando(newOwner);
    }

    constructor(address flipTokenAddress) ERC721("FlippandoGameMaster", "FGMT") {
        flipToken = FLIP(flipTokenAddress);
        owner = msg.sender;
    }

    function createGame(uint256 boardSize, GameType gameType, string memory gameTileType) external {
        string memory metadata = '{"name": "Flippando Game", "description": "Estoy flippando en colores", "status": "created", "image": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iMjUiIHZpZXdCb3g9IjAiIGZpbGw9IiMwMDAwMDAiIC8+Cg=="}';
        if (gameType == GameType.Sponsored) {
            require(flipToken.balanceOf(msg.sender) >= FLIP_PER_SPONSORED_GAME, "Insufficient FLIP tokens");
            
            uint256 gameId = tokenIdCounter;
            tokenIdCounter++;

            _safeMint(msg.sender, gameId);
            _setTokenURI(gameId, metadata);

            games[gameId] = Game({
                creator: msg.sender,
                player: address(this),
                metadata: metadata,
                gameTileType: gameTileType,
                gameType: gameType,
                gameStatus: "created",
                flipTokensLocked: FLIP_PER_SPONSORED_GAME
            });

            sponsoredGames[msg.sender].push(gameId);
        } else {
            uint256 gameId = tokenIdCounter;
            tokenIdCounter++;

            _safeMint(msg.sender, gameId);
            _setTokenURI(gameId, metadata);

            games[gameId] = Game({
                creator: msg.sender,
                player: msg.sender,
                metadata: metadata,
                gameType: gameType,
                gameStatus: "created",
                gameTileType: gameTileType,
                flipTokensLocked: 1
            });

            normalGames[msg.sender].push(gameId);
        }
    }

    function initializeGame(string memory gameId, uint256 boardSize) public {
        // check if the game with gameId exists
        uint256 extractedGameId = extractGameId(gameId);
        require(_exists(extractedGameId), "Game does not exist");
        games[extractedGameId].gameStatus = "started";
        // call Flippando initialize_game(gameId, boardSize, gameTileType, gamePlayer) function
        flippando.initialize_game(gameId, boardSize, games[extractedGameId].gameTileType, msg.sender);
    }

    function finishGame(string memory gameId, address user) external onlyOwner {
        uint256 extractedGameId = extractGameId(gameId);
        require(_exists(extractedGameId), "Game does not exist");
        games[extractedGameId].gameStatus = "solved";
    }

    // not implemented
    // this needs to be called from an external point, to avoid game squatting
    // if there are more than 24 hours since a game has been claimed (or less, we will see)
    // and the game is not yet solved
    // the game is released
    function releaseGame(uint256 gameId) external {
        require(_exists(gameId), "Game does not exist");
        require(games[gameId].gameType == GameType.Sponsored, "Game is not sponsored");
        require( (keccak256(bytes(games[gameId].gameStatus))) != keccak256(bytes("solved")), "Game is already solved");
        games[gameId].gameStatus = "created";
    }

    function getSponsoredGames(address creator) external view returns (uint256[] memory) {
        return sponsoredGames[creator];
    }

    function getNormalGames(address creator) external view returns (uint256[] memory) {
        return normalGames[creator];
    }

    function getGameMetadata(uint256 gameId) external view returns (string memory) {
        require(_exists(gameId), "Game does not exist");
        return games[gameId].metadata;
    }

    // string utilities
    function makeGameId(uint256 tokenId) internal view returns (string memory) {
        // Convert the address to a string
        string memory addressString = toAsciiString(address(this));

        // Convert the tokenId to a string
        string memory tokenIdString = toString(tokenId);

        // Concatenate the address and tokenId strings
        string memory concatenatedString = string(abi.encodePacked(addressString, tokenIdString));

        return concatenatedString;
    }

    function extractGameId(string memory concatenated) public pure returns (uint256) {
        bytes memory data = bytes(concatenated);
        
        // Get the length of the contract address (address size in bytes is 20)
        uint256 addressSize = 20;
        
        // Extract the game ID from the bytes after the contract address
        uint256 gameId;
        assembly {
            gameId := mload(add(add(data, addressSize), 0x20))
        }
        
        return gameId;
    }


    function toAsciiString(address x) internal pure returns (string memory) {
        bytes memory s = new bytes(40);
        for (uint i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint(uint160(x)) / (2**(8*(19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            s[2*i] = char(hi);
            s[2*i+1] = char(lo);
        }
        return string(s);
    }

    function char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }

    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

}
